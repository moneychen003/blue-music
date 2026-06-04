import { parse } from 'regexparam'
import type { Component } from 'svelte'

type Path = string | RegExp

interface AsyncComponent {
  component: () => Promise<{ default: Component } | Component>
  loadingComponent: Component
}
export type RouteComponent = Component | AsyncComponent

export interface RouteDetail {
  /**  Route matched as defined in the route definition (could be a string or a reguar expression object) */
  route: string | RegExp
  /** Location path */
  location: string
  /** Querystring from the hash */
  query: Record<string, string>
  /** Svelte component (only in `routeLoaded` events) */
  component: Component
  /** Name of the Svelte component (only in `routeLoaded` events) */
  name: string
  /** Parameters parsed from the URL, if the route definition contains parameters. */
  params: RegExpExecArray | Record<string, unknown> | null
}

/**
 * Container for a route: path, component
 */
export class RouteItem {
  path: Path
  component: RouteComponent
  prefix?: Path
  private readonly _pattern
  private readonly _keys: string[] | false
  /**
   * Initializes the object and creates a regular expression from the path, using regexparam.
   *
   * @param path - Path to the route (must start with '/' or '*')
   * @param component - Svelte component for the route, optionally wrapped
   */
  constructor(path: Path, component: RouteComponent, prefix?: Path) {
    this.path = path
    this.prefix = prefix
    this.component = component

    const { pattern, keys } = parse(path as string)
    this._pattern = pattern
    this._keys = keys
  }

  /**
   * Checks if `path` matches the current route.
   * If there's a match, will return the list of parameters from the URL (if any).
   * In case of no match, the method will return `null`.
   *
   * @param path - Path to test
   * @returns List of paramters from the URL if there's a match, or `null` otherwise.
   */
  match(path: string) {
    // If there's a prefix, check if it matches the start of the path.
    // If not, bail early, else remove it before we run the matching.
    if (this.prefix) {
      if (typeof this.prefix == 'string') {
        if (path.startsWith(this.prefix)) {
          path = path.substring(this.prefix.length) || '/'
        } else {
          return null
        }
      } else if (this.prefix instanceof RegExp) {
        const match = path.match(this.prefix)
        if (match?.[0]) {
          path = path.substring(match[0].length) || '/'
        } else {
          return null
        }
      }
    }

    // Check if the pattern matches
    const matches = this._pattern.exec(path)
    if (matches === null) {
      return null
    }

    // If the input was a regular expression, this._keys would be false, so return matches as is
    if (!this._keys) {
      return matches
    }

    const out: Record<string, unknown> = {}
    let i = 0
    while (i < this._keys.length) {
      // In the match parameters, URL-decode all values
      try {
        out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null
      } catch (e) {
        out[this._keys[i]] = null
      }
      i++
    }
    return out
  }
}
