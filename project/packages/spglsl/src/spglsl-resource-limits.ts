export const SpglslResourceLimits = {
  maxLights: 32,
  maxClipPlanes: 6,
  maxTextureUnits: 32,
  maxTextureCoords: 32,
  maxVertexAttribs: 64,
  maxVertexUniformComponents: 4096,
  maxVaryingFloats: 64,
  maxVertexTextureImageUnits: 32,
  maxCombinedTextureImageUnits: 80,
  maxTextureImageUnits: 32,
  maxFragmentUniformComponents: 4096,
  maxDrawBuffers: 64,
  maxVertexUniformVectors: 1024,
  maxVaryingVectors: 8,
  maxFragmentUniformVectors: 1024,
  maxVertexOutputVectors: 64,
  maxFragmentInputVectors: 64,
  minProgramTexelOffset: -8,
  maxProgramTexelOffset: 7,
  maxClipDistances: 8,
  maxComputeWorkGroupCountX: 65535,
  maxComputeWorkGroupCountY: 65535,
  maxComputeWorkGroupCountZ: 65535,
  maxComputeWorkGroupSizeX: 1024,
  maxComputeWorkGroupSizeY: 1024,
  maxComputeWorkGroupSizeZ: 64,
  maxComputeUniformComponents: 1024,
  maxComputeTextureImageUnits: 16,
  maxComputeImageUniforms: 8,
  maxComputeAtomicCounters: 8,
  maxComputeAtomicCounterBuffers: 1,
  maxVaryingComponents: 60,
  maxVertexOutputComponents: 64,
  maxGeometryInputComponents: 64,
  maxGeometryOutputComponents: 128,
  maxFragmentInputComponents: 128,
  maxImageUnits: 8,
  maxCombinedImageUnitsAndFragmentOutputs: 8,
  maxCombinedShaderOutputResources: 8,
  maxImageSamples: 0,
  maxVertexImageUniforms: 0,
  maxTessControlImageUniforms: 0,
  maxTessEvaluationImageUniforms: 0,
  maxGeometryImageUniforms: 0,
  maxFragmentImageUniforms: 8,
  maxCombinedImageUniforms: 8,
  maxGeometryTextureImageUnits: 16,
  maxGeometryOutputVertices: 256,
  maxGeometryTotalOutputComponents: 1024,
  maxGeometryUniformComponents: 1024,
  maxGeometryVaryingComponents: 64,
  maxTessControlInputComponents: 128,
  maxTessControlOutputComponents: 128,
  maxTessControlTextureImageUnits: 16,
  maxTessControlUniformComponents: 1024,
  maxTessControlTotalOutputComponents: 4096,
  maxTessEvaluationInputComponents: 128,
  maxTessEvaluationOutputComponents: 128,
  maxTessEvaluationTextureImageUnits: 16,
  maxTessEvaluationUniformComponents: 1024,
  maxTessPatchComponents: 120,
  maxPatchVertices: 32,
  maxTessGenLevel: 64,
  maxViewports: 16,
  maxVertexAtomicCounters: 0,
  maxTessControlAtomicCounters: 0,
  maxTessEvaluationAtomicCounters: 0,
  maxGeometryAtomicCounters: 0,
  maxFragmentAtomicCounters: 8,
  maxCombinedAtomicCounters: 8,
  maxAtomicCounterBindings: 128,
  maxVertexAtomicCounterBuffers: 128,
  maxTessControlAtomicCounterBuffers: 0,
  maxTessEvaluationAtomicCounterBuffers: 0,
  maxGeometryAtomicCounterBuffers: 0,
  maxFragmentAtomicCounterBuffers: 1,
  maxCombinedAtomicCounterBuffers: 1,
  maxAtomicCounterBufferSize: 16384,
  maxTransformFeedbackBuffers: 4,
  maxTransformFeedbackInterleavedComponents: 64,
  maxCullDistances: 8,
  maxCombinedClipAndCullDistances: 8,
  maxSamples: 4,
  maxMeshOutputVerticesNV: 256,
  maxMeshOutputPrimitivesNV: 512,
  maxMeshWorkGroupSizeX_NV: 32,
  maxMeshWorkGroupSizeY_NV: 1,
  maxMeshWorkGroupSizeZ_NV: 1,
  maxTaskWorkGroupSizeX_NV: 32,
  maxTaskWorkGroupSizeY_NV: 1,
  maxTaskWorkGroupSizeZ_NV: 1,
  maxMeshViewCountNV: 4,

  limits_nonInductiveForLoops: 1,
  limits_whileLoops: 1,
  limits_doWhileLoops: 1,
  limits_generalUniformIndexing: 1,
  limits_generalAttributeMatrixVectorIndexing: 1,
  limits_generalVaryingIndexing: 1,
  limits_generalSamplerIndexing: 1,
  limits_generalVariableIndexing: 1,
  limits_generalConstantMatrixVectorIndexing: 1,

  // Angle specific

  maxDualSourceDrawBuffers: 8,
  maxViewsOVR: 8,
  minProgramTextureGatherOffset: -16,
  maxProgramTextureGatherOffset: 15,
  maxUniformLocations: 16384,
  maxUniformBufferBindings: 128,
  maxShaderStorageBufferBindings: 32,
  maxGeometryUniformBlocks: 64,
  maxGeometryShaderStorageBlocks: 32,
  maxGeometryShaderInvocations: 256,
  subPixelBits: 8,
  maxPointSize: 4999.5,

  // Extensions.
  // Set to 1 to enable the extension, else 0.
  extension_OES_standard_derivatives: true,
  extension_OES_EGL_image_external: true,
  extension_OES_EGL_image_external_essl3: true,
  extension_NV_EGL_stream_consumer_external: true,
  extension_ARB_texture_rectangle: true,
  extension_EXT_blend_func_extended: true,
  extension_EXT_draw_buffers: true,
  extension_EXT_frag_depth: true,
  extension_EXT_shader_texture_lod: true,
  extension_EXT_shader_framebuffer_fetch: true,
  extension_NV_shader_framebuffer_fetch: true,
  extension_NV_shader_noperspective_interpolation: true,
  extension_ARM_shader_framebuffer_fetch: true,
  extension_OVR_multiview: true,
  extension_OVR_multiview2: true,
  extension_EXT_multisampled_render_to_texture: true,
  extension_EXT_YUV_target: true,
  extension_EXT_geometry_shader: true,
  extension_EXT_gpu_shader5: true,
  extension_EXT_shader_non_constant_global_initializers: true,
  extension_OES_texture_storage_multisample_2d_array: true,
  extension_OES_texture_3D: true,
  extension_ANGLE_texture_multisample: true,
  extension_ANGLE_multi_draw: true,
  extension_ANGLE_base_vertex_base_instance: true,
  extension_WEBGL_video_texture: true,
  extension_APPLE_clip_distance: true,
  extension_OES_texture_cube_map_array: true,
  extension_EXT_texture_cube_map_array: true
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SpglslResourceLimits = typeof SpglslResourceLimits
