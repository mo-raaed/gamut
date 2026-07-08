import { domAnimation } from 'motion/react';

/** Async feature bundle for LazyMotion — code-split so the initial JS
 *  payload stays small; animations hydrate as soon as this chunk lands. */
export default domAnimation;
