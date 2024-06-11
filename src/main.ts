import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { getDropIndicator } from './drag-preview';
import invariant from 'tiny-invariant';

const items = document.querySelectorAll('[data-task-id]');

const cleanups = Array.from(items)
  .filter((element): element is HTMLElement => element instanceof HTMLElement)
  .map((element) => {
    const cleanup = combine(
      draggable({
        element,
        onGenerateDragPreview({ nativeSetDragImage }) {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({
              x: '16px',
              y: '8px',
            }),
            render({ container }) {
              // Dynamically creating a more reduce drag preview
              const preview = document.createElement('div');
              preview.classList.add('border-solid', 'rounded', 'p-2', 'bg-white');

              // Use a part of the element as the content for the drag preview
              preview.textContent =
                element.querySelector('[data-task-content]')?.textContent ??
                // worst case fallback if we set up our data-* up wrong
                element.textContent;

              container.appendChild(preview);
            },
          });
        },
        onDragStart() {
          element.classList.add('opacity-40');
        },
        onDrop() {
          element.classList.remove('opacity-40');
        },
      }),
      dropTargetForElements({
        element,
        canDrop({ source }) {
          // cannot drop on self
          if (source.element === element) {
            return false;
          }
          // only accepting tasks
          return source.element.hasAttribute('data-task-id');
        },
        getData({ input }) {
          return attachClosestEdge(
            {},
            {
              element,
              input,
              allowedEdges: ['top', 'bottom'],
            },
          );
        },
        getIsSticky() {
          return true;
        },
        onDragEnter({ self }) {
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) {
            return;
          }
          const indicator = getDropIndicator({ edge: closestEdge, gap: '8px' });
          element.insertAdjacentElement('afterend', indicator);
        },
        onDrag({ self }) {
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) {
            element.nextElementSibling?.remove();
            return;
          }

          // don't need to do anything, already have a drop indicator in the right spot
          if (element.nextElementSibling?.getAttribute('data-edge') === closestEdge) {
            return;
          }

          // get rid of the old drop indicator
          element.nextElementSibling?.remove();

          // make a new one
          const indicator = getDropIndicator({ edge: closestEdge, gap: '8px' });
          element.insertAdjacentElement('afterend', indicator);
        },
        onDragLeave() {
          element.nextElementSibling?.remove();
        },
        onDrop({ self, source }) {
          element.nextElementSibling?.remove();

          const closestEdgeOfTarget = extractClosestEdge(self.data);

          const items = Array.from(document.querySelectorAll('[data-task-id]'));
          const indexOfSource = items.indexOf(source.element);
          const indexOfTarget = items.indexOf(element);

          if (indexOfTarget < 0 || indexOfSource < 0) {
            return;
          }

          // 1. swap with other element
          const destinationIndex = getReorderDestinationIndex({
            axis: 'vertical',
            closestEdgeOfTarget,
            indexOfTarget,
            startIndex: indexOfSource,
          });

          const atDestinationIndex = items[destinationIndex];

          // grabbing the parent of the item which is our "position:relative" container
          const toMove = source.element.parentElement;
          invariant(toMove);

          console.log({ destinationIndex, atDestinationIndex, toMove, closestEdgeOfTarget });

          atDestinationIndex.parentElement?.insertAdjacentElement(
            // going above the target
            closestEdgeOfTarget === 'top' ? 'beforebegin' : 'afterend',
            toMove,
          );
        },
      }),
    );
    return cleanup;
  });
