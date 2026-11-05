/** Export lato browser: SVG così com'è, PNG rasterizzando l'SVG su un canvas. */

function scarica(blob: Blob, nome: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = nome;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function scaricaSvg(svg: string, nome: string) {
	scarica(new Blob([svg], { type: 'image/svg+xml' }), `${nome}.svg`);
}

/** larghezzaPx: larghezza del PNG in pixel. */
export async function scaricaPng(svg: string, nome: string, larghezzaPx = 2000) {
	const img = new Image();
	const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
	try {
		await new Promise<void>((ok, ko) => {
			img.onload = () => ok();
			img.onerror = () => ko(new Error('SVG non caricabile'));
			img.src = url;
		});
		const k = larghezzaPx / img.width;
		const canvas = document.createElement('canvas');
		canvas.width = larghezzaPx;
		canvas.height = Math.round(img.height * k);
		canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
		const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'));
		if (blob) scarica(blob, `${nome}.png`);
	} finally {
		URL.revokeObjectURL(url);
	}
}
