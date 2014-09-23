# Shalam

A friendly tool for CSS spriting


## Installation

```bash
git clone https://gitenterprise.inside-box.net/mbasta/shalam.git
cd shalam
npm install
```


## Adding Sprites

Simply use the `sprite` declaration in your CSS files:

```css
.my-great-class {
    background-size: 32px 32px;
    font-size: 1.5em;
    font-weight: bold;

    sprite: "files-page/chevron";
}
```

When shalam is run, you'll get this code:

```css
.my-great-class {
    font-size: 1.5em;
    font-weight: bold;

    sprite: "files-page/chevron.png" dest-size(32px 32px) source-size(64px 64px);
    /* shalam! */
    background-image: url(../img/sprites/files-page.png);
    background-size: 32px 32px;
    background-position: -128px -24px;
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
shalam static/css static/img static/img/sprites
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
shalam static/css static/img static/img/sprites
```

will yield

```css
/* ~/myapp/static/css/main.css */
.foo {
    sprite: "image.png";
    /* shalam! */
    background-image: url(../img/sprites/main.png);
    /* end shalam */
}
```
