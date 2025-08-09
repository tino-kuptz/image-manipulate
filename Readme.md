# image-manipulate
A docker container for creating images defined by a json file. Easily compose images using dynamic data, without any third party service.

## Intro

### Motivation
I tried to center a text in n8n without paying someone for an api. As the image manipulation api is kinda bad in n8n, and I didn't know how to actually write a custom node, I simply made a docker container that can be queried to generate images

### Honorable mention
This project is only possible due to the work done by the contributors of [sharp](https://www.npmjs.com/package/sharp) ❤️

## Run
The image is available via [Dockerhub](https://hub.docker.com/r/tinokuptz/image-manipulate):
```sh
docker run -p 3000:3000 tinokuptz/image-manipulate:latest
```
Browse to http://localhost:3000 and you can play around with it, see [a screenshot of the gui](https://github.com/tino-kuptz/image-manipulate/blob/main/readme/local-frontend.png).

## API Usage
In order to create an image using this container you simply need to post to `/api/v1/image` with a body like this:
```jsonc
{
    "format": "png",
    "quality": 100,
    "canvas": {
        // Target image size
        "width": 1024,
        "height": 1024
    },
    "steps": [
        {
            // First step: draw an image over the full size
            "action": "draw_image",
            "x": 0,
            "y": 0,
            "width": 1024,
            "height": 1024,
            "source": "https://placehold.co/1024x1024.png"
        },
        {
            // Second step: write a text with 200px padding to each border
            "action": "write_text",
            "x": 200, // Padding left
            "y": 200, // Padding top
            "width": 624,  // = 1024 - 2x 200
            "height": 624, // = 1204 - 2x 200
            "text": "Hello World, Hello, Hello World, Hello World, Hello World, Hello World, Hello World",
            "font_size": 60,
            "align": "left",
            "valign": "center",
            "draw_border": true
        }
    ]
}
```
The resulting image will look like this:<br>
<img src="readme/example-image.png" alt="Generated example image" style="max-width: 50dvw; max-height: 50dvh;" />

> [!TIP]
> You can use [jsonc](https://github.com/komkom/jsonc) in the request body, so you can comment your single steps for better management.
> Please be aware, that if you use jsonc, you need to change the Content-Type to `application/jsonc` instead of `application/json`, otherwise you will get a http error 400 - "invalid json"

### Possible steps
Steps will be executed from to to bottom, so that you always draw "on top of the image"

#### draw_image
This draws an image. Parameters:
| Name | Description | Example value |
|---|---|--:|
| `x` | x-offset (left side) of the image | `0` |
| `y` | y-offset (top) of the image | `0` |
| `width` | Target width of the image | `1024` |
| `height` | Target height of the image | `1024` |
| `source` | Source to pull the image from; must be `http` or `https` (with trusted cert) | `https://placehold.co/1024x1024.png` |

Example step:
```json
{ "action": "draw_image", "x": 20, "y": 20, "width": 128, "height": 128, "text": "https://placehold.co/128x128.png" }
```

Optional values for draw_image:
| Name | Description | Default value |
|---|---|--:|
| `opacity` | Image opacity 0..1 | `1` |

Your image will always be placed to cover your box. If you put an image with 512x512px in a width=256 and height=512 box, the left and right side of the image will be cut.

### write_text
Writes an text on the image
| Name | Description | Example value |
|---|---|--:|
| `x` | x-offset (left side) of the textbox | `0` |
| `y` | y-offset (top) of the textbox | `0` |
| `width` | Target width of the textbox | `1024` |
| `height` | Target height of the textbox | `1024` |
| `text` | The text to write | `Hello world` |

There are some optional values, too
| Name | Description | Default value |
|---|---|--:|
| `align` | Horizontal align of text in the box<br>`left` / `center` / `right` | `start` |
| `valign` | Vertical align of text in the box<br>`top` / `center` / `bottom` | `top` |
| `draw_border` | For e.g. debugging; draw a border around the textbox<br>Can be set to `true`, or even an object `"draw_border": { "color": "#RRGGBB", "stroke_width": 2, "radius": 0 }` | `false` |
| `font` | Font use | `Arial` |
| `font_size` | Target font size, in pixels | `20` |
| `color` | Color hex code | `#000000` |
| `line_break` | Break text when it's longer then the textboxs width | `true` |

Example step:
```json
{ "action": "write_text", "x": 10, "y": 10, "width": 250, "height": 30, "text": "Hellow world" }
```

There is an optional argument for write_text:
| Name | Description | Default value |
|---|---|--:|
| `opacity` | Text opacity 0..1 | `1` |

#### blur_region
Blur a rectangular region of the current image
| Name | Description | Default |
|---|---|--:|
| `x` | x-offset (left) of the region | required |
| `y` | y-offset (top) of the region | required |
| `width` | Width of the region | required |
| `height` | Height of the region | required |
| `sigma` | Blur strength passed to Gaussian blur | `10` |

Example step:
```json
{ "action": "blur_region", "x": 312, "y": 312, "width": 400, "height": 400, "sigma": 12 }
```

#### draw_square
Draw a rectangle (optionally rounded), with fill and/or stroke
| Name | Description | Default |
|---|---|--:|
| `x` | x-offset (left) where to place the rectangle | required |
| `y` | y-offset (top) where to place the rectangle | required |
| `width` | Rectangle width | required |
| `height` | Rectangle height | required |
| `fill` | Fill color (e.g. `#RRGGBB`) | none |

Example step:
```json
{ "action": "draw_square", "x": 412, "y": 412, "width": 400, "height": 400, "fill": "#FFAA00", "stroke": "#333333", "stroke_width": 4, "radius": 12, "opacity": 0.85 }
```

There are some optional options, too:
| Name | Description | Default value |
|---|---|--:|
| `stroke` | Stroke color (e.g. `#RRGGBB`) | `#000000` |
| `stroke_width` | Stroke width in px | `0` |
| `radius` | Corner radius in px | `0` |
| `opacity` | Fill opacity 0..1 | `1` |

Opacity: same as CSS, `0` = transparent, `1` = full visible

#### draw_line
Draw a line passing through a list of points
| Name | Description | Default |
|---|---|--:|
| `points` | Array of `[x, y]` points (at least 2) | required |

Example step:
```json
{ "action": "draw_line", "points": [[10,10],[60,40],[120,20],[200,80]], "stroke": "#00AEEF", "stroke_width": 6 }
```

Optional values for draw_line:
| Name | Description | Default value |
| `stroke` | Line color | `#000000` |
| `stroke_width` | Line width | `2` |
| `opacity` | Line opacity 0..1 | `1` |

Opacity: same as CSS, `0` = transparent, `1` = full visible

### more?
More steps might come from time to time, as soon as I need them.
In case you need some - feel free to issue a pull request.

## Development and building
For me, until I configure drone ci on this one
```sh
# AMD64
docker build --platform linux/amd64 -t tinokuptz/image-manipulate:latest -t tinokuptz/image-manipulate:1.1 .
docker push tinokuptz/image-manipulate:latest
docker push tinokuptz/image-manipulate:1.1
```