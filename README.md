# Shalam

[![Project Status](http://opensource.box.com/badges/active.svg)](http://opensource.box.com/badges)

A friendly tool for CSS spriting. Shalam allows you to add Retina-friendly,
high-quality image sprites to your website without modifying any markup.


## Installation

### Mac OS X

First, you'll need to make sure that your system is ready. If you're running
OS X, you'll need Cairo installed. Cairo depends on XQuartz. You'll want to
download and install XQuartz from here:

https://xquartz.macosforge.org/landing/

Then install Cairo and pkgconfig with [Homebrew](http://brew.sh):

```bash
brew install cairo pkgconfig
npm install -g shalam
```

If you get an error about `xcb-shm`, try running the following before running
`npm install`:

```bash
export PKG_CONFIG_PATH=/opt/X11/lib/pkgconfig
```

### Linux

If you'd like to use Shalam on Linux, you can run a similar set of commands:

```bash
yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel

npm install -g shalam
```

### Windows

Windows support is currently not available. You may find success, however, after [installing node-canvas manually](https://github.com/Automattic/node-canvas/wiki/Installation---Windows). Patches to add or improve Windows support are welcome.


## Adding Sprites

Simply use the `-shalam-sprite` declaration in your CSS files:

```css
.my-great-class {
    font-size: 1.5em;
    font-weight: bold;

    -shalam-sprite: "files-page/chevron.png" dest-size(32px 32px);
}
```

The syntax for `-shalam-sprite` is simple: a string containing a path to an image asset (discussed below) is required. Following the string is an optional `dest-size()` modifier. `dest-size()` allows you to specify the height and width of the image as you would like it to appear on the page. This is usually the `width` and `height` of the element you are applying `-shalam-sprite` to. Only two positive non-zero numbers that use `px` as the unit are accepted.


When shalam is run, you'll get this code:

```css
.my-great-class {
    font-size: 1.5em;
    font-weight: bold;

    -shalam-sprite: "files-page/chevron.png" dest-size(32px 32px);
    /* shalam! */;
    background: url(../img/sprites/files-page.png) -20px -74px;
    background: url(../img/sprites/files-page.compat.png) -50px -24px / 125px 32px;
    /* end shalam */
}
```

The `background` declarations with all the fixins are generated for you! This means that generating sprites with retina assets (even if your assets are not all retina) is a breeze.


## Running

```bash
shalam /path/to/source/css /path/to/source/images /path/to/final/output/image
```

So for instance, you might run:

```
shalam static/css static/img static/img/sprite
```

The URL paths to the sprited images that will be inserted into the CSS will be
relative to their paths on the disk. In the above example, the following code:

```css
/* ~/myapp/static/css/main.css */
.foo {
    -shalam-sprite: "image.png";
}
```

run with the following command:

```bash
shalam static/css static/img static/img/sprite
```

will yield

```css
/* ~/myapp/static/css/main.css */
.foo {
    -shalam-sprite: "image.png";
    /* shalam! */
    background: url(../img/sprite.png) 0 0;
    /* end shalam */
}
```


## Other Features

More advanced features are documented on the wiki:

- [Support for pulling source images directly from Git](wiki/Git-Support)
- [Ability to define sprite "packages" for easy sprite re-use](wiki/Package-Support)


## Support

Need to contact us directly? Email oss@box.com and be sure to include the name of this project in the subject.


## Copyright and License

Copyright 2015 Box, Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
