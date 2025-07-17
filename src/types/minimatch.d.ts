declare module 'minimatch' {
  interface MinimatchOptions {
    debug?: boolean;
    nobrace?: boolean;
    noglobstar?: boolean;
    dot?: boolean;
    noext?: boolean;
    nocase?: boolean;
    nonull?: boolean;
    matchBase?: boolean;
    nocomment?: boolean;
    nonegate?: boolean;
    flipNegate?: boolean;
  }
  
  function minimatch(path: string, pattern: string, options?: MinimatchOptions): boolean;
  export = minimatch;
} 