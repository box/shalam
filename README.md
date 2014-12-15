# Shalam

A friendly tool for CSS spriting


## Installation

### Mac OS X

First, you'll need to make sure that your system is ready. If you're running
OS X, you'll need Cairo installed. Cairo depends on XQuartz. You'll want to
download and install XQuartz from here:

https://xquartz.macosforge.org/landing/

Then install Cairo and pkgconfig with [Homebrew](http://brew.sh):

```bash
brew install cairo pkgconfig
git clone https://gitenterprise.inside-box.net/mbasta/shalam.git
cd shalam
npm install
```

### Linux

If you'd like to use Shalam on a Linux server, you can run a similar set of commands:

```bash
yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel

git clone https://gitenterprise.inside-box.net/mbasta/shalam.git
cd shalam
npm install
```

### Troubleshooting

If you get an error about `xcb-shm` on OS X, try running the following before running
`npm install`:

```bash
export PKG_CONFIG_PATH=/opt/X11/lib/pkgconfig
```


## Adding Sprites

Simply use the `-shalam-sprite` declaration in your CSS files:

```css
.my-great-class {
    font-size: 1.5em;
    font-weight: bold;

    -shalam-sprite: "files-page/chevron.png" dest-size(32px 32px);
}
```

When shalam is run, you'll get this code:

```css
.my-great-class {
    font-size: 1.5em;
    font-weight: bold;

    -shalam-sprite: "files-page/chevron.png" dest-size(32px 32px);
    /* shalam! */
    ;
    background: url(../img/sprites/files-page.png) -20px -74px;
    background: url(../img/sprites/files-page.png) -50px -24px / 125px 32px;
    /* end shalam */
}
```

The `background` declarations with all the fixins are generated for you! This means that generating sprites with retina assets (even if your assets are not all retina) is a breeze.


## Running

```bash
shalam /path/to/css/directory /path/to/sprite/images /path/to/image/destination
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


## Support

Need to contact us directly? Email oss@box.com and be sure to include the name of this project in the subject.


## Copyright and License

Copyright 2014 Box, Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
