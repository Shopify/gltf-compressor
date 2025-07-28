# gltf-compressor

<p align="center">
 <img src="https://github.com/Shopify/gltf-compressor/blob/main/readme_images/editor.png" />
</p>

glTF Compressor is an open source tool for compressing glTF files.

It offers a simple but powerful workflow that we frequently use at Shopify to optimize 3D models. The workflow is designed to help you answer this question:

> How much can I compress the textures of my model before it starts looking noticeably bad?

To achieve that, the tool exposes all the textures of your glTF file and allows you to change their:

- Image format (JPEG, PNG and WebP).
- Resolution.
- Quality.

It also allows you to quickly compare the original model with the compressed one by holding/releasing the C key on your keyboard.

That we know of, no other web-based glTF compression tool exposes those settings in such a straightfoward way.

Additionally, this tool offers a few mesh and animation optimization options that can be applied on export.

We hope you find this tool as useful as we do.

## Running locally

To run locally, simply execute these commands in the root of this repository:

```
npm install
npm run dev
```

## Controls

- Left click and drag to rotate the camera.
- Right click and drag to move the camera.
- Use the scrollwheel to zoom in and out.
- Hold C to show the original model. Release C to show the compressed model.
- Hold X to highlight meshes that use the selected material.

## Acknowledgments

This tool relies heavily on Don McCurdy's fantastic [glTF Transform](https://gltf-transform.dev/) library.

It also borrows ideas and snippets of code from pmndrs' [glTF to JSX converter](https://gltf.pmnd.rs/) and various other pmndrs libraries like [drei](https://drei.docs.pmnd.rs/getting-started/introduction).

Thank you for your amazing work.
