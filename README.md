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
```

### Linux

If you'd like to use Shalam on your devvm, install Cairo and its dependencies through yum:

```bash
yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel
```

### Installation

```bash
git clone https://gitenterprise.inside-box.net/mbasta/shalam.git
cd shalam
npm install
```

If you get an error about `xcb-shm`, try running the following before running
`npm install`:

```bash
export PKG_CONFIG_PATH=/opt/X11/lib/pkgconfig
```


## Adding Sprites

Simply use the `sprite` declaration in your CSS files:

```css
.my-great-class {
    font-size: 1.5em;
    font-weight: bold;

    sprite: "files-page/chevron.png";
}
```

When shalam is run, you'll get this code:

```css
.my-great-class {
    font-size: 1.5em;
    font-weight: bold;

    sprite: "files-page/chevron.png" dest-size(32px 32px);
    /* shalam! */
    ;
    background: url(../img/sprites/files-page.png) -20px -74px;
    background: url(../img/sprites/files-page.png) -50px -24px / 125px 32px;
    /* end shalam */
}
```

The `background-size` and `background-position` declarations are generated for
you! This means that generating sprites with retina assets (even if your assets
are not all retina) is a breeze.


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
    sprite: "image.png";
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
    sprite: "image.png";
    /* shalam! */
    background: url(../img/sprite.png) 0 0;
    /* end shalam */
}
```


## Future Work

The following are planned features:

- Image paths are currently opaque string identifiers. In the future, these
  will be replaced by `url()`s.
