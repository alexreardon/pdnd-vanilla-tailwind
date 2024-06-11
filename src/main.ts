import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

const items = document.querySelectorAll('[data-task-id]');

const cleanups = Array.from(items)
  .filter((element): element is HTMLElement => element instanceof HTMLElement)
  .map((element) => {
    const cleanup = combine(
      draggable({
        element,
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
