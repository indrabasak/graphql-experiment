GraphQL Client Examples
=======================
This repository contains examples of how to use the GraphQL client in TypeScript.

## Build Application
After retrieving the sample application from the GitHub repository, ensure its successful build by executing the
following command:

```
yarn install
yarn dist:util
```

## Run Application
Please make sure to change the values in the `constants.ts` file before running the application.

To run the application, execute the following command:

```
node ./dist/util/util/opus-util.js
```

This should create a CSV file named `output.csv` in the `dist/util/util` directory.