# AAM
Full-Scale SPA: Asset Management Platform
Scalable platform for financial companies to manage individual investment accounts based on model portfolios.
By combining different model portfolios we are able to provide clients with unique strategies according to their risk profile.
Client orders are generated automatically by applying the structure of the model portfolio to each account and then could be merged into one order for execution. Market trades allocated between accounts according to individual orders.
Diverse system of restrictions could be set for each portfolio in order to realize clients preferences.

Features:
- Whole investment managment cycle (client portfolios, stratiegies, investment restrictions, model portfolios, orders, trades, analitics, performance/mangement fees)
- Whole accounting cycle (balance sheet (closing, opening, reconcilation), fees processing, FIFO (including short sales), deatiled reporting, flexible accounting schemes managemnt system, cash/securities accounts (overdrafts), manual/automantic/stp transactions,  swifts

Architecture: Angualr UI => NodeJS Express RESTful API => PostgreSQL DB
- User Interface => Angualr UI
- MiddleWare API => NodeJS Express
- Database => PostgreSQL

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.0.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change  the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
