# Primate (formerly KongDash)

> A modern desktop client for [Kong](https://konghq.com/kong/) admin API

[![](screenshot.png)](screenshot.png)

### How to Install

👉 This information is only for versions v0.3.0 and below. 

👉 The succeding release is still in the final stages of its development. See **For Developers** section below.

#### On Linux
_Ubuntu and other Debian distributions:_

- Download the [latest](https://github.com/getprimate/primate/releases) .deb package. 
- Run `dpkg -i kongdash-x.y.z-arch.deb`


_Fedora and other Linux distributions:_

- Download the [latest](https://github.com/getprimate/primate/releases) .tar.gz archive.
- Extract the archive and run install.sh script.

```shell
tar -xvf kongdash-x.y.z-linux-arch.tar.gz
cd kongdash-x.y.z-linux-arch
./install.sh
```

_x.y.z refers to the version number and arch refers to the architecture (ia32 or x64)._

#### On Windows
Simply download the [latest](https://github.com/getprimate/primate/releases) .exe installer and run it.

#### On Mac OS X
Download and open the [latest](https://github.com/getprimate/primate/releases) .dmg image, move the app to /Applications to start using it.

### For Developers
All kinds of contributions are welcome.

- Requires NodeJs (v16.13.2 or higher) and yarn (v1.22.17 or higher).
- Built with [Electron](https://www.electronjs.org/).

Clone the repository
```shell
git clone https://github.com/getprimate/primate
```

Install dependencies
```shell
yarn install
```

Run the app
```shell
yarn start
```

Run ESLint
```yarn run lint```

### License
MIT License. See [LICENSE](LICENSE).
