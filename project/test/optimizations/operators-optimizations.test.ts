import { expect } from "chai";
import { spglslAngleCompile, SpglslAngleCompileError } from "spglsl";

const SHADER_PREFIX =
  "#version 300 es\nprecision mediump float;uniform int iN;uniform bool iB;uniform lowp sampler2D s;uniform vec4 vA,vB;layout(location=1)out vec4 V;layout(location=2)out vec4 P;layout(location=3)out int N;layout(location=4)out uint uN;";

describe("operators-optimizations", function () {
  this.timeout(7000);

  it("removes positive operator", async () => {
    expect(await compileMain("P.x=+P.y;")).to.eq("P.x=P.y;");
    expect(await compileMain("P.x=+ + +P.y;")).to.eq("P.x=P.y;");
  });

  it("removes double negations", async () => {
    expect(await compileMain("P.x=-P.y;")).to.eq("P.x=-P.y;");
    expect(await compileMain("P.x=- -P.y;")).to.eq("P.x=P.y;");
    expect(await compileMain("P.x=- - -P.y;")).to.eq("P.x=-P.y;");
    expect(await compileMain("P.x=- - - -P.y;")).to.eq("P.x=P.y;");
  });

  it("removes double bitwise not", async () => {
    expect(await compileMain("N=~iN;")).to.eq("N=~iN;");
    expect(await compileMain("N=~~iN;")).to.eq("N=iN;");
    expect(await compileMain("N=~~~iN;")).to.eq("N=~iN;");
    expect(await compileMain("N=~~~~iN;")).to.eq("N=iN;");
  });

  it("removes double logical not", async () => {
    expect(await compileMain("N=int(!iB);")).to.eq("N=int(!iB);");
    expect(await compileMain("N=int(!!iB);")).to.eq("N=int(iB);");
    expect(await compileMain("N=int(!!!iB);")).to.eq("N=int(!iB);");
    expect(await compileMain("N=int(!!!!iB);")).to.eq("N=int(iB);");
  });

  it("Optimizes boolean negations", async () => {
    expect(await compileMain("N=int(!(vA==vB));")).to.eq("N=int(vA!=vB);");
    expect(await compileMain("N=int(!(vA!=vB));")).to.eq("N=int(vA==vB);");
    expect(await compileMain("N=int(!(vA.x>vB.x));")).to.eq("N=int(vA.x<=vB.x);");
    expect(await compileMain("N=int(!(vA.x<vB.x));")).to.eq("N=int(vA.x>=vB.x);");
    expect(await compileMain("N=int(!(vA.x>=vB.x));")).to.eq("N=int(vA.x<vB.x);");
    expect(await compileMain("N=int(!(vA.x<=vB.x));")).to.eq("N=int(vA.x>vB.x);");
  });

  it("Optimizes ternary negation", async () => {
    expect(await compileMain("P.x=!(vA.x>vB.x)?vA.z:vA.w;")).to.eq("P.x=vA.x>vB.x?vA.w:vA.z;");
  });

  it("Optimizes addition and substractions with 0", async () => {
    expect(await compileMain("P.x=vA.x+0.;")).to.eq("P.x=vA.x;");
    expect(await compileMain("P.x=0.+vA.x;")).to.eq("P.x=vA.x;");

    expect(await compileMain("P=vA+0.;")).to.eq("P=vA;");
    expect(await compileMain("P=0.+vA;")).to.eq("P=vA;");
    expect(await compileMain("P=vA+vec4(0);")).to.eq("P=vA;");
    expect(await compileMain("P=vec4(0)+vA;")).to.eq("P=vA;");

    expect(await compileMain("P.x=vA.x-0.;")).to.eq("P.x=vA.x;");
    expect(await compileMain("P.x=0.-vA.x;")).to.eq("P.x=-vA.x;");

    expect(await compileMain("P.x+=0.;")).to.eq("");
    expect(await compileMain("P.x-=0.;")).to.eq("");
  });

  it("Optimizes multiplication with 1", async () => {
    expect(await compileMain("P.x=vA.x*1.;")).to.eq("P.x=vA.x;");
    expect(await compileMain("P.x=1.*vA.x;")).to.eq("P.x=vA.x;");

    expect(await compileMain("P=vA*1.;")).to.eq("P=vA;");
    // expect(await compileMain("P=1.*vA;")).to.eq("P=vA;");
    expect(await compileMain("P=vA*vec4(1);")).to.eq("P=vA;");
    expect(await compileMain("P=vec4(1)*vA;")).to.eq("P=vA;");

    expect(await compileMain("P.x*=1.;")).to.eq("");
    expect(await compileMain("P.x/=1.;")).to.eq("");
  });

  it("Optimizes division by 1", async () => {
    expect(await compileMain("P.x=vA.x/1.;")).to.eq("P.x=vA.x;");
    expect(await compileMain("P=vA/1.;")).to.eq("P=vA;");
    expect(await compileMain("P=vA/vec4(1);")).to.eq("P=vA;");
    expect(await compileMain("P.x/=1.;")).to.eq("");
  });

  it("regression intrinsic ops", async () => {
    const tests = [
      // Trigonometric
      "P.x=sin(vA.x);",
      "P.x=cos(vA.x);",
      "P.x=tan(vA.x);",
      "P.x=asin(vA.x);",
      "P.x=acos(vA.x);",
      "P.x=atan(vA.x);",
      "P.x=atan(vA.x,vB.x);",

      // Exponential
      "P.x=pow(vA.x,vB.x);",
      "P.x=exp(vA.x);",
      "P.x=log(vA.x);",
      "P.x=exp2(vA.x);",
      "P.x=log2(vA.x);",
      "P.x=sqrt(vA.x);",
      "P.x=inversesqrt(vA.x);",

      // Common
      "P.x=abs(vA.x);",
      "P.x=sign(vA.x);",
      "P.x=floor(vA.x);",
      "P.x=ceil(vA.x);",
      "P.x=fract(vA.x);",
      "P.x=mod(vA.x,vB.x);",
      "P.x=min(vA.x,vB.x);",
      "P.x=max(vA.x,vB.x);",
      "P.x=clamp(vA.x,0.,1.);",
      "P.x=mix(vA.x,vB.x,.5);",
      "P.x=step(.5,vA.x);",
      "P.x=smoothstep(0.,1.,vA.x);",

      // Geometric
      "P.x=length(vA);",
      "P.x=distance(vA,vB);",
      "P.x=dot(vA,vB);",
      "P=normalize(vA);",
      "P=vec4(cross(vA.xyz,vB.xyz),1.);",
      "P=faceforward(vA,vB,vA);",
      "P=reflect(vA,vB);",
      "P=refract(vA,vB,.5);",

      // Matrix
      "P.xyz=vA.xyz*transpose(mat3(vA.zyx,vB.xyz,vA.xzy));",
      "P.x=determinant(mat3(vA.zyx,vB.xyz,vA.xzy));",
      "P.xyz=vA.xyz*inverse(mat3(vA.zyx,vB.xyz,vA.xzy));",

      // Angles
      "P.x=radians(vA.x);",
      "P.x=degrees(vA.x);",

      // Derivatives
      "P.x=dFdx(vA.x);",
      "P.x=dFdy(vA.x);",
      "P.x=fwidth(vA.x);",

      // Packing / Unpacking
      "uN=packUnorm2x16(vA.xy);",
      "uN=packSnorm2x16(vA.xy);",
      "uN=packHalf2x16(vA.xy);",
      // "P.x=unpackUnorm2x16(N);",
      // "P.x=unpackSnorm2x16(N);",
      // "P.x=unpackHalf2x16(N);",

      // Texture functions (requires sampler2D `s`)
      "P=texture(s,vA.xy);",
      "P=textureProj(s,vA);",
      "P=textureLod(s,vA.xy,0.);",
      "P=textureProjLod(s,vA,0.);",
      "P=textureGrad(s,vA.xy,vA.xy,vB.xy);",
      "P=textureProjGrad(s,vA,vA.xy,vB.xy);",
      "N=textureSize(s,0).x;",
    ];

    for (const code of tests) {
      let compiled = "";
      try {
        compiled = await compileMain(code);
        expect(compiled).to.eq(code);
      } catch (e) {
        if (e instanceof Error) {
          e.message = `${e.message}\n      src: ${code}\n      out: ${compiled}`;
        }
        throw e;
      }
    }
  });
});

async function compileMain(code: string): Promise<string> {
  let result = await compile(`void main(){${code}}`);
  result = result.replace("void main(){", "");
  if (result.endsWith("}")) {
    result = result.slice(0, -1);
  }
  return result;
}

async function compile(code: string): Promise<string> {
  const compiled = await spglslAngleCompile({
    mainSourceCode: SHADER_PREFIX + code,
    compileMode: "Optimize",
    mangle: false,
    minify: false,
    beautify: false,
  });
  if (compiled.infoLog.hasErrors()) {
    throw new SpglslAngleCompileError(compiled);
  }
  if (compiled.output) {
    const validated = await spglslAngleCompile({
      mainSourceCode: compiled.output,
      compileMode: "Validate",
    });
    if (validated.infoLog.hasErrors()) {
      throw new SpglslAngleCompileError(validated);
    }
    return compiled.output.replace(SHADER_PREFIX, "");
  }
  return "";
}
