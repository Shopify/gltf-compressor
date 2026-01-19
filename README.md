# glTF Compressor

Interactively compress your glTF files with ease. See your changes in realtime before exporting!

👉 [Use it here](https://gltf-compressor.com/) 👈

## Description

<p align="center">
 <img src="https://github.com/Shopify/gltf-compressor/blob/main/readme_images/editor.png" />
</p>

glTF Compressor is an open source tool for compressing glTF files.

It offers a simple but powerful workflow that we frequently use at Shopify to optimize 3D models. The workflow is designed to help you answer this question:

> How much can I compress the textures of my model before it starts looking noticeably bad?

To achieve that, the tool exposes all the textures of your glTF file and allows you to change their:

- Image format (JPEG, PNG, WebP and KTX2).
- Resolution.
- Quality.

All changes happen in realtime so you can see the effects right away. You can quickly compare the original model with the compressed one by holding/releasing the `C` key on your keyboard.

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
- Hold the `C` key to show the original model. Release it to show the compressed model.
- Hold the `X` key to highlight meshes that use the selected material.

## Acknowledgments

This tool relies heavily on Don McCurdy's fantastic [glTF Transform](https://gltf-transform.dev/) library and Hu Song's [KTX2-Encoder](https://husong.me/ktx2-encoder/) library.

It also borrows ideas and snippets of code from pmndrs' [glTF to JSX converter](https://gltf.pmnd.rs/) and various other pmndrs libraries like [drei](https://drei.docs.pmnd.rs/getting-started/introduction).

The demo model of a couch was made by Eric Chadwick. It can be found [here](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ChairDamaskPurplegold).

Thank you for your amazing work!
