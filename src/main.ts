import {
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import invariant from 'tiny-invariant';
import { getDropIndicator } from './drag-preview';
import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types';

function attachAll(): CleanupFn {
  const cleanups = Array.from(document.querySelectorAll('[data-task-id]'))
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

            if (!closestEdgeOfTarget) {
              return;
            }

            // the "position:relative" container around the item
            const toMove = source.element.parentElement;
            invariant(toMove);

            element.parentElement?.insertAdjacentElement(
              closestEdgeOfTarget === 'top' ? 'beforebegin' : 'afterend',
              toMove,
            );
          },
        }),
      );
      return cleanup;
    });

  return function cleanupAll() {
    cleanups.forEach((fn) => fn());
  };
}

attachAll();
