/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export {};  // Ensure this file is a module.

const processIsDebug =
    typeof process === 'undefined' || process.env.NODE_ENV !== 'dev';
const esmHmrIsPresent = !!(import.meta as HotImportMeta).hot;
/**
 * This code shouldn't be imported in prod, but if it is, try to give any
 * bundler as many chances as it can to dead code eliminate it.
 */
const inDebugMode = processIsDebug || esmHmrIsPresent;

/**
 * Provides an interface by which custom element classes can do hot module
 * reloading.
 *
 * Important warning:
 *   Hot module reloading is hot in the sense of fast, but also hot as
 *   in CAUTION WILL VAPORIZE FINGERS. When in doubt, reload the page, and never
 *   ever use when connected to a production store of data. Any JS based hot
 *   reloading necessarily violates the assumptions of otherwise-correct code,
 *   causing it to execute undefined behavior.
 *
 * An element class that defines the method notifyOnHotModuleReload can be
 * defined on the custom elements registry multiple times. The first time,
 * the element is registered normally. Each subsequent time, the original will
 * receive a call to notifyOnHotModuleReload with the new class object, where
 * it can patch prototypes, re-render existing instances, etc.
 */
if (inDebugMode) {
  const isHotReloadableElementClass =
      (maybe: Constructor<HTMLElement>): maybe is HotReloadableElementClass => {
        // This isn't safe against name mangling, but this is definitely debug
        // code, so that's fine.
        return 'notifyOnHotModuleReload' in maybe;
      };

  const originalDefine = customElements.define;

  const implMap = new Map<string, HotReloadableElementClass>();
  const hotDefine: typeof customElements.define = function hotDefine(
      tagname, classObj) {
    if (!isHotReloadableElementClass(classObj)) {
      originalDefine.call(customElements, tagname, classObj);
      return;
    }
    const impl = implMap.get(tagname);
    if (!impl) {
      implMap.set(tagname, classObj);
      originalDefine.call(customElements, tagname, classObj);
    } else {
      impl.notifyOnHotModuleReload(tagname, classObj);
    }
  };

  customElements.define = hotDefine;
}

interface Constructor<T> {
  new(): T;
}

/**
 * This is the interface that the custom element class should implement in
 * order to hot reload.
 *
 * Note that this is an interface for the class itself, not instances,so
 * notifyOnHotModuleReload must be a static method.
 */
export interface HotReloadableElementClass extends Constructor<HTMLElement> {
  /**
   * Static method that's called when customElements.define has been called
   * more than once.
   *
   * @param tagname The HTML tag name for the class. This is particularly
   *     useful when notifyOnHotModuleReload is implemented on a base class
   *     so it might be called with many different tag names. Can be helpful
   *     in finding instances of the element in the document.
   * @param updatedClass The newer version of this class
   *     (or some other class that's trying to claim this class' tagname).
   */
  notifyOnHotModuleReload(
      tagname: string, updatedClass: HotReloadableElementClass): void;
}

/** See https://github.com/pikapkg/esm-hmr */
interface HotImportMeta extends ImportMeta {
  hot?: object;
}
