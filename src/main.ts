import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';

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
              preview.textContent =
                element.querySelector('[data-task-content]')?.textContent ?? element.textContent;

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
          return source.element.hasAttribute('data-task-id');
        },
      }),
    );
    return cleanup;
  });
