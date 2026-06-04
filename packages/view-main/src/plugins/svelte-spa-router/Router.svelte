<script lang="ts">
  import { onMount, type Component } from 'svelte'
  import { type RouteComponent, RouteItem } from './common'
  import { type Location, loc, restoreScroll, setParams } from './navigator'

  const {
    routes,
    prefix,
    restoreScrollState,
    // ..._props
  }: {
    /**
     * Dictionary of all routes, in the format `'/path': component`.
     *
     * For example:
     * ````js
     * import HomeRoute from './routes/HomeRoute.svelte'
     * import BooksRoute from './routes/BooksRoute.svelte'
     * import NotFoundRoute from './routes/NotFoundRoute.svelte'
     * routes = {
     *     '/': HomeRoute,
     *     '/books': BooksRoute,
     *     '*': NotFoundRoute
     * }
     * ````
     */
    routes: Record<string, RouteComponent>
    /**
     * Optional prefix for the routes in this router. This is useful for example in the case of nested routers.
     */
    prefix?: string
    /**
     * If set to true, the router will restore scroll positions on back navigation
     * and scroll to top on forward navigation.
     */
    restoreScrollState?: boolean
  } = $props()

  // Props for the component to render
  let Cmp = $state.raw<Component | null>(null)
  let componentParams = $state.raw<RegExpExecArray | Record<string, unknown> | null>(null)

  // Set up all routes
  const routesList = $derived(
    Object.entries(routes).map(([path, cmp]) => {
      return new RouteItem(path, cmp, prefix)
    })
  )

  // If this is set, then that means we have popped into this var the state of our last scroll position
  let previousScrollState = $state.raw(null)

  // Update history.scrollRestoration depending on restoreScrollState
  $effect(() => {
    history.scrollRestoration = restoreScrollState ? 'manual' : 'auto'
  })
  $effect(() => {
    if (!restoreScrollState) return
    const popStateChanged = (event: PopStateEvent) => {
      // If this event was from our history.replaceState, event.state will contain
      // our scroll history. Otherwise, event.state will be null (like on forward
      // navigation)
      if (event.state && (event.state.__svelte_spa_router_scrollY || event.state.__svelte_spa_router_scrollX)) {
        previousScrollState = event.state
      } else {
        previousScrollState = null
      }
    }
    // This is removed in the destroy() invocation below
    window.addEventListener('popstate', popStateChanged)
    restoreScroll(previousScrollState)
    return () => {
      window.removeEventListener('popstate', popStateChanged)
    }
  })

  // let loadingRouters = new Set<() => Promise<unknown>>()
  onMount(() => {
    // Always have the latest value of loc
    let lastLoc: Location | null = null

    // Handle hash change events
    // Listen to changes in the $loc store and update the page
    // Do not use the $: syntax because it gets triggered by too many things
    const unsubscribeLoc = loc.subscribe(async (newLoc) => {
      lastLoc = newLoc

      // Find a route matching the location
      for (const route of routesList) {
        const match = route.match(newLoc.location)
        if (!match) continue
        setParams(match)
        // const detail: RouteDetail = {
        //   route: route.path,
        //   location: newLoc.location,
        //   querystring: newLoc.querystring,
        //   params:
        //     match && typeof match == 'object' && Object.keys(match).length
        //       ? match
        //       : null,
        // }

        // Trigger an event to alert that we're loading the route
        // We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
        // dispatchNextTick('routeLoading', { ...detail })

        // If there's a component to show while we're loading the route, display it
        const componentObj = route.component
        // Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
        // if (componentObj != obj) {
        //   if (obj.loading) {
        //     component = obj.loading
        //     componentObj = obj
        //     componentParams = obj.loadingParams
        //     _props = {}

        //     // Trigger the routeLoaded event for the loading component
        //     // Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
        //     // dispatchNextTick('routeLoaded', {
        //     //   ...detail,
        //     //   component,
        //     //   name: component.name,
        //     //   params: componentParams,
        //     // })
        //   } else {
        //     component = null
        //     componentObj = null
        //   }

        // Invoke the Promise
        if (typeof componentObj == 'object') {
          Cmp = componentObj.loadingComponent
          let cmp: Component | null
          try {
            const resp = await componentObj.component()
            cmp = 'default' in resp ? resp.default : resp
          } catch (e) {
            console.error(e)
            cmp = null
          }
          if (newLoc != lastLoc) return
          Cmp = cmp
        } else {
          Cmp = componentObj
        }

        // Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
        if (newLoc != lastLoc) {
          // Don't update the component, just exit
          return
        }
        // Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
        // Of course, this assumes that developers always add a "params" prop when they are expecting parameters
        if (match && typeof match == 'object' && Object.keys(match).length) {
          componentParams = match
        } else {
          componentParams = null
        }

        // Dispatch the routeLoaded event then exit
        // We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
        // dispatchNextTick('routeLoaded', {
        //   ...detail,
        //   component,
        //   name: component.name,
        //   params: componentParams,
        // }).then(() => {
        //   params.set(componentParams)
        // })
        return
      }
      // If we're still here, there was no match, so show the empty component
      Cmp = null
    })
    return () => {
      unsubscribeLoc()
    }
  })
</script>

{#if componentParams}
  <Cmp params={componentParams} />
{:else}
  <Cmp />
{/if}
