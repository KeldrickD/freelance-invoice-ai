declare module 'minimatch' {
  function minimatch(path: string, pattern: string, options?: any): boolean;
  export = minimatch;
} 