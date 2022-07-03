# Contributing to Primate

Thank you for your interest in contributing to Primate! There are several ways by which you can contribute to Primate, 
as a developer or even as regular user.

The goal of this document is to provide a high level overview of those ways by which you can participate.

## Providing Feedbacks

If you have found any bugs, issues or have suggestions for improvement, 
well you're always welcome to report them. See the topic below to learn how you can report it.

### Reporting Issues and Suggesting Improvements

You can use GitHubs issue tracker to report the bugs, suggest improvements or report any other issues you have found while using the application.

Please follow these guidelines while raising your issue:
- Check open issues to see if the same issue or suggestions has already been reported. If the issue is already reported:
  - Provide relevant comments. 
  - Express your reactions ith emojis.
- If the issue is not reported yet, create an 'Issue' with the following guidelines:
  - Provide a descriptive title for the issue.
  - Include the which version of Primate you are using and also the name of your operating system.
  - If the issue is a `bug`, try to include steps to reproduce the same numbered as `1, 2, 3...`
  - Mention what is the current behavior and the expected behavior of the application.
  - Try to include screenshots or video demonstrating the issue.
  - If possible, try to provide screenshots of the 'Activity Log' blurring any sensitive information. 

## Creating Pull Requests

Before you start developing Primate, please make sure the following requirements are met:

- `Node.js` version 16.0.0 LTS or higher.
- `Yarn` version 1.22.0 or higher.

If you don't have Yarn already installed, please see [this link](https://yarnpkg.com/getting-started/install).

Once you have all the requirements set up,

[Fork](https://github.com/getprimate/primate/fork) the repository.

Clone the forked repository to your computer 

```shell
$ git clone git@github.com:<your_username>/primate.git
```

Install the dependencies

```shell
$ cd primate
$ yarn install
```

Run the application

```shell
$ yarn start
```

You can now start making changes to the code now.

### Submitting Your Changes

Create a pull request to the `main` branch to get your changes reviewed and merged.

Please keep the following suggestions in mind while creating pull requests:
- Provide a useful title with a suitable prefix from the list below :-
  - `feat` for new features.
  - `enhance` for enhancements or improvements.
  - `bugfix` for bugfixes.
- If multiple labels are valid for a pull request, choose them considering the precedence as they are mentioned above.
    - For example, you have improved a module and this improvement automatically fixes a bug, 
      pick the label as `enhance` and mention the bugfix in the description.
- Provide detailed description of the changes in the pull request.
- Run `$ yarn run lint` to see if the formatting and coding conventions are maintained.
- In case of newly added features and bugfixes, it is good to include relevant screenshots.
- Avoid mixing changes to multiple modules and libraries in the same pull request, unless there is a strong dependency between them.
