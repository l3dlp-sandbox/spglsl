#version 310 es
precision mediump float;
out vec4 my_FragColor;
void main() {
  const float f = pow(1.0, float[2](0.0, 1.0)[0]);
  my_FragColor = vec4(f);
}

// ShaderValidation FragmentShaderValidationTest, BuiltInFunctionWithMultipleParametersAppliedToArrayConstructorIsConst