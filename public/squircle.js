class SquirclePainter {
  static get inputProperties() {
    return ['--squircle-radius', '--squircle-smooth'];
  }

  paint(ctx, geom, properties) {
    const r = parseFloat(properties.get('--squircle-radius').toString()) || 0;
    const smooth = parseFloat(properties.get('--squircle-smooth').toString()) || 1;
    const w = geom.width;
    const h = geom.height;

    ctx.beginPath();
    
    // We approximate a squircle using bezier curves
    // A superellipse formula could be used, but bezier curves are often faster for paths.
    // For simplicity, here is an approximation using cubic bezier for a smooth corner.
    const m = r * (1 - smooth * (1 - 0.552284749831)); // 0.5522... is the magic number for circular arcs

    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.bezierCurveTo(w - m, 0, w, m, w, r);
    ctx.lineTo(w, h - r);
    ctx.bezierCurveTo(w, h - m, w - m, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.bezierCurveTo(m, h, 0, h - m, 0, h - r);
    ctx.lineTo(0, r);
    ctx.bezierCurveTo(0, m, m, 0, r, 0);
    
    ctx.closePath();
    
    ctx.fillStyle = '#000'; // mask color doesn't matter, only alpha
    ctx.fill();
  }
}

if (typeof registerPaint !== 'undefined') {
  registerPaint('squircle', SquirclePainter);
}
