import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from "@angular/router";

interface IRouteConfigData {
  reuse: boolean;
}

interface ICachedRoute {
  handle: DetachedRouteHandle;
  data: IRouteConfigData;
}

@Injectable()
export class MaltsevRouteReuseStrategy implements RouteReuseStrategy {
  private routeCache = new Map < string, ICachedRoute > ();

  shouldReuseRoute(
      future: ActivatedRouteSnapshot,
      curr: ActivatedRouteSnapshot
  ): boolean {
      let ret = future.routeConfig === curr.routeConfig;
    //   console.log("shouldReuseRoute called", ret);
      if (ret) {
          this.addRedirectsRecursively(future); // update redirects
      }
      return ret;
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
      const data = this.getRouteData(route);
    //   console.log('data route', data);
    //   console.log(
    //       "shouldDetach check if we want to detach and store route",
    //       data && data.reuse
    //   );
      return data && data.reuse;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
      const url = this.getFullRouteUrl(route);
      const data = this.getRouteData(route);
      this.routeCache.set(url, {
          handle,
          data
      });
      this.addRedirectsRecursively(route);
  }
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
      const url = this.getFullRouteUrl(route);
    //   console.log(
    //       "shouldAttach if retrive route is true",
    //       this.routeCache.has(url)
    //   );
      return this.routeCache.has(url);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
      const url = this.getFullRouteUrl(route);
      const data = this.getRouteData(route);
      console.log(
          "retrive route",
          data && data.reuse && this.routeCache.has(url)
      );
      return data && data.reuse && this.routeCache.has(url) ?
          this.routeCache.get(url).handle :
          null;
  }

  private addRedirectsRecursively(route: ActivatedRouteSnapshot): void {
      const config = route.routeConfig;
      if (config) {
          if (!config.loadChildren) {
              const routeFirstChild = route.firstChild;
              const routeFirstChildUrl = routeFirstChild ?
                  this.getRouteUrlPaths(routeFirstChild).join("/") :
                  "";
              const childConfigs = config.children;
              if (childConfigs) {
                  const childConfigWithRedirect = childConfigs.find(
                      c => c.path === "" && !!c.redirectTo
                  );
                  if (childConfigWithRedirect) {
                      childConfigWithRedirect.redirectTo = routeFirstChildUrl;
                  }
              }
          }
          route.children.forEach(childRoute =>
              this.addRedirectsRecursively(childRoute)
          );
      }
  }

  private getFullRouteUrl(route: ActivatedRouteSnapshot): string {
      return this.getFullRouteUrlPaths(route)
          .filter(Boolean)
          .join("/");
  }

  private getFullRouteUrlPaths(route: ActivatedRouteSnapshot): string[] {
      const paths = this.getRouteUrlPaths(route);
      return route.parent ? [...this.getFullRouteUrlPaths(route.parent), ...paths] :
          paths;
  }

  private getRouteUrlPaths(route: ActivatedRouteSnapshot): string[] {
      return route.url.map(urlSegment => urlSegment.path);
  }

  private getRouteData(route: ActivatedRouteSnapshot): IRouteConfigData {
    console.log('route.routeConfig.data',route.routeConfig.path);
      return route.routeConfig && (route.routeConfig.data as IRouteConfigData);
  }
}