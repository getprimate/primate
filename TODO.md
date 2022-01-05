# TODO List

## Features

- [x] Use a library for managing tag input text areas.

## Patches
- [ ] *upstream-list.js+html* : Enable primary hash input box only if `hash_on` is set to `cookie` or `header`.
- [ ] *consumer-edit.js+html* : Add tags input field in all authentication method forms.
- [ ] *consumer-edit.js+html* : Add algorithm and RSA key input fields JWT auth form.
- [ ] *consumer-edit.js+html* : Sanitise authentication method forms. Delete fields with null values and empty strings from payload.
- [ ] *consumer-edit.js+html* : Use a separate function to sanitise null values in GET API response.
- [ ] *consumer-edit.js+html* : Show plugin list while editing a consumer.
- [x] Enable support for multiple action buttons in `viewFrame`.
- [x] *upstream-list.js+html* : Load certificate list in create and edit mode.
- [x] *upstream-list.js+html* : Lock `client_certificate` if the route is `/certificates/:certId/upstreams`.
