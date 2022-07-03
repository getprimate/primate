# Contributing to Primate

Thank you for your interest in contributing to Primate! 

There are several ways by which you can contribute to Primate, as a developer or even as regular user.
The goal of this document is to provide a high level overview of those ways by which you can participate.

## Providing Feedbacks

If you have found any bugs, issues or have any suggestions for improvement, you can use the [issue tracker](https://github.com/getprimate/primate/issues) to file them.

Please follow these guidelines while opening an issue.
- Check the list of [open issues](https://github.com/getprimate/primate/issues?q=is%3Aopen+is%3Aissue) to see if the issue has already been reported. 
  If the issue is already reported:
  - Make relevant comments. 
  - Express your reactions with emojis.
- If the issue is not reported yet, [open a new issue](https://github.com/getprimate/primate/issues/new):
  - Provide a descriptive title for the issue.
  - Include the version number of Primate you are using and also the name of your operating system.
  - If the issue is a `bug`, try to include steps to reproduce the same, numbered as `1, 2, 3...`
  - Mention what is the current behavior and the expected behavior.
  - Try to include screenshots or videos demonstrating the issue.
  - If possible, try to provide screenshots of the `Activity Log` blurring any sensitive information. 

## Creating Pull Requests

To start developing, you will need to install the following:

- [x] `Node.js` version 16.0.0 LTS or higher.
- [x] `Yarn` version 1.22.0 or higher.

If you don't have Yarn already installed, please refer [this link](https://yarnpkg.com/getting-started/install).

Once you have all the requirements set up, [Fork](https://github.com/getprimate/primate/fork) the repository.

Clone the forked repository to your computer.
```shell
$ git clone git@github.com:<your_username>/primate.git
```

Install the required Node modules.
```shell
$ cd primate
$ yarn install
```

Run the application.
```shell
$ yarn start
```

You can now start making changes to the code.

### Submitting Your Changes

Create a pull request to the `main` branch to get your changes reviewed and merged.

Please keep the following suggestions in mind while creating pull requests.
- Run `$ yarn run lint` to see if the formatting and coding conventions are maintained.
- Provide a useful title with a suitable prefix from the list below:
  - `feat` for new features.
  - `enhance` for enhancements or improvements.
  - `bugfix` for bugfixes.
- If multiple labels are valid for a pull request, choose them considering the precedence as they are mentioned above.
    - For example, you have improved a module and this improvement automatically fixes a bug, 
      pick the label as `enhance` and mention the bugfix in the description.
- Provide detailed information regarding the changes in the description box.
- In case of newly added features and bugfixes, it is good to include relevant screenshots.
- Avoid mixing changes to multiple modules and libraries in the same pull request, unless there is a strong dependency between them.
