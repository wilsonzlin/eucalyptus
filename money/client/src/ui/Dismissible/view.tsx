import React, {createRef, RefObject, useCallback, useEffect} from 'react';
import {assertInstanceOf} from '../../util/Assert';

const POINTER_START_EVENTS = ['mousedown', 'touchstart'];
const EVENTS = [...POINTER_START_EVENTS, 'resize', 'wheel', 'fullscreenchange', 'orientationchange', 'scroll'];

export type DismissibleProps<E> = {
  events?: string[];
  onDismiss: () => void;
  children: (ref: RefObject<E>) => JSX.Element;
};

export function Dismissible<E extends HTMLElement> ({
  events = EVENTS,
  onDismiss,
  children,
}: DismissibleProps<E>) {
  const containerRef = createRef<E>();

  const outsideEventHandler = useCallback(({target}: Event) => {
    if (containerRef.current && !containerRef.current.contains(assertInstanceOf(target, HTMLElement))) {
      onDismiss();
    }
  }, [containerRef, onDismiss]);

  const unbindHandlers = useCallback(() => {
    for (const event of events) {
      document.removeEventListener(event, outsideEventHandler, true);
    }
  }, [events, outsideEventHandler]);

  useEffect(() => {
    for (const event of events) {
      document.addEventListener(event, outsideEventHandler, true);
    }

    return unbindHandlers;
  }, [outsideEventHandler, unbindHandlers]);

  return children(containerRef);
}

export function PointerDismissible<E extends HTMLElement> (props: Omit<DismissibleProps<E>, 'events'>) {
  return (
    <Dismissible events={POINTER_START_EVENTS} {...props}/>
  );
}
