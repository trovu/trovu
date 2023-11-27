# Editors

You are welcome to contribute to Trovu [shortcuts](../shortcuts/namespaces.md), [cities](../shortcuts/urls.md#city), [code](https://github.com/trovu/trovu) and more.

## Edit directly or fork + pull request

Members of the [editors](https://github.com/orgs/trovu/teams/editors) team can edit directly the [Trovu repo](https://github.com/trovu/trovu). Others please fork and edit it, and create a pull request.

## Contribute shortcuts

Shortcuts are part of the [/data](https://github.com/trovu/trovu/tree/master/data) subdirectory. Add shortcuts to a matching [namespace](../shortcuts/namespaces.md), following the [content policy](policy.md).

## Contribute cities

Also city abbreviations are part of the [/data](https://github.com/trovu/trovu/tree/master/data) subdirectory, organized by countries. You are welcome to add abbreviations for new countries. They should follow a system or pattern well-known to the country's citizens (e.g. [vehicle registration plates](https://en.wikipedia.org/wiki/Vehicle_registration_plate) in Germany).

## Contribute documentation

Documentation lives in the [/docs](https://github.com/trovu/trovu/tree/master/docs) subdirectory. You are welcome to make any improvements.

## Deploy via Github Actions

For every contribution to the monorepo, be it data (shortcuts) or documentation, be aware that it needs to be deployed. This happens automatically after changes to the `master` branch.

You can follow the execution of the action execution on [Github Actions](https://github.com/trovu/trovu/actions). Seconds after it finished successfully, the changes should be published on [trovu.net](https://trovu.net/)

During deployment, shortcuts get compiled into [trovu.net/data.json](https://trovu.net/data.json). This is your first place to check anything does not work as expected.

Before deployment, the current build is pushed to [trovu/trovu-deploy](https://github.com/trovu/trovu-deploy). This is the second place to check your change is missing.
