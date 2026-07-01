export const p2 = (n: number) => (n < 10 ? '0' : '') + n;
export const rnd = (n: number) => Math.random() * n;
export const rndpm = (n: number) => (Math.random() - 0.5) * n * 2;
export const easeIO = (t: number) => t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
export const MAT_CHARS = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01';
