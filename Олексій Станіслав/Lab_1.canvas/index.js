document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("trajectoryCanvas");
  const ctx = canvas.getContext("2d");
  const calculateBtn = document.getElementById("calculate");
  const resetBtn = document.getElementById("reset");

  const resultsDiv = document.getElementById("results");

  const scale = 10;
  const originX = 50;
  const originY = canvas.height - 50;

  function drawAxes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    ctx.moveTo(originX, originY);
    ctx.lineTo(canvas.width - 20, originY);
    ctx.moveTo(canvas.width - 20, originY);
    ctx.lineTo(canvas.width - 30, originY - 5);
    ctx.moveTo(canvas.width - 20, originY);
    ctx.lineTo(canvas.width - 30, originY + 5);

    ctx.moveTo(originX, originY);
    ctx.lineTo(originX, 20);

    ctx.moveTo(originX, 20);
    ctx.lineTo(originX - 5, 30);
    ctx.moveTo(originX, 20);
    ctx.lineTo(originX + 5, 30);

    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "14px Arial";
    ctx.fillText("x (м)", canvas.width - 30, originY + 20);
    ctx.fillText("y (м)", originX - 30, 30);

    ctx.textAlign = "center";
    for (let x = 5; x <= (canvas.width - originX) / scale; x += 5) {
      const xPixel = originX + x * scale;
      ctx.beginPath();
      ctx.moveTo(xPixel, originY - 5);
      ctx.lineTo(xPixel, originY + 5);
      ctx.stroke();
      ctx.fillText(x.toString(), xPixel, originY + 20);
    }

    ctx.textAlign = "right";
    for (let y = 5; y <= originY / scale; y += 5) {
      const yPixel = originY - y * scale;
      ctx.beginPath();
      ctx.moveTo(originX - 5, yPixel);
      ctx.lineTo(originX + 5, yPixel);
      ctx.stroke();
      ctx.fillText(y.toString(), originX - 10, yPixel + 5);
    }
  }

  function calculateTrajectory() {
    const x0 = parseFloat(document.getElementById("x0").value) || 0;
    const y0 = parseFloat(document.getElementById("y0").value) || 0;
    const angle = parseFloat(document.getElementById("angle").value) || 45;
    const v0 = parseFloat(document.getElementById("velocity").value) || 20;
    let a = parseFloat(document.getElementById("acceleration").value);

    a = isNaN(a) ? 9.8 : a;

    const isZeroAcceleration = Math.abs(a) < 1e-10;
    console.log("Чи нульове прискорення:", isZeroAcceleration);

    const angleRad = (angle * Math.PI) / 180;

    const v0x = v0 * Math.cos(angleRad);
    const v0y = v0 * Math.sin(angleRad);

    let flightTime, maxHeight, xMax;

    if (isZeroAcceleration) {
      if (v0y === 0) {
        flightTime = 10;
        maxHeight = y0;
      } else if (v0y > 0) {
        flightTime = 10;
        maxHeight = y0 + v0y * flightTime;
      } else {
        if (y0 > 0) {
          flightTime = y0 / Math.abs(v0y);
        } else {
          flightTime = 0;
        }
        maxHeight = y0;
      }

      xMax = x0 + v0x * flightTime;
    } else {
      const A = -0.5 * a;
      const B = v0y;
      const C = y0;

      const discriminant = B * B - 4 * A * C;

      if (discriminant < 0) {
        flightTime = 10;
      } else {
        const sqrtDisc = Math.sqrt(discriminant);
        const t1 = (-B + sqrtDisc) / (2 * A);
        const t2 = (-B - sqrtDisc) / (2 * A);

        if (t1 > 0 && t2 > 0) {
          flightTime = Math.min(t1, t2);
        } else if (t1 > 0) {
          flightTime = t1;
        } else if (t2 > 0) {
          flightTime = t2;
        } else {
          flightTime = 0;
        }
      }

      const tMaxHeight = v0y / a;

      if (tMaxHeight > 0 && tMaxHeight < flightTime) {
        maxHeight = y0 + v0y * tMaxHeight - 0.5 * a * tMaxHeight * tMaxHeight;
      } else {
        maxHeight = y0;
      }

      xMax = x0 + v0x * flightTime;
    }

    if (flightTime > 20) {
      flightTime = 20;
    }

    resultsDiv.innerHTML = `
                <p>Час польоту: ${flightTime.toFixed(2)} с</p>
                <p>Максимальна висота: ${maxHeight.toFixed(2)} м</p>
                <p>Дальність польоту: ${xMax.toFixed(2)} м</p>
                <p>Тип руху: ${
                  isZeroAcceleration
                    ? "Рівномірний прямолінійний"
                    : "Рівноприскорений"
                }</p>
            `;

    drawAxes();

    ctx.beginPath();
    ctx.strokeStyle = "#3498db";
    ctx.lineWidth = 2;

    if (flightTime <= 0) {
      console.log("Час польоту <= 0, траєкторія не малюється");
      return;
    }

    const timeStep = flightTime / 100;

    for (let t = 0; t <= flightTime; t += timeStep) {
      let x, y;

      if (isZeroAcceleration) {
        x = x0 + v0x * t;
        y = y0 + v0y * t;
      } else {
        x = x0 + v0x * t;
        y = y0 + v0y * t - 0.5 * a * t * t;
      }

      const xPixel = originX + x * scale;
      const yPixel = originY - y * scale;

      if (t === 0) {
        ctx.moveTo(xPixel, yPixel);
      } else {
        ctx.lineTo(xPixel, yPixel);
      }
    }

    ctx.stroke();

    const startXPixel = originX + x0 * scale;
    const startYPixel = originY - y0 * scale;

    ctx.beginPath();

    ctx.arc(startXPixel, startYPixel, 5, 0, 2 * Math.PI);
    ctx.fill();

    const arrowLength = 30;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(startXPixel, startYPixel);
    ctx.lineTo(
      startXPixel + arrowLength * Math.cos(angleRad),
      startYPixel - arrowLength * Math.sin(angleRad)
    );
    ctx.stroke();

    console.log("Розрахунок траєкторії завершено");
  }

  drawAxes();

  calculateBtn.addEventListener("click", calculateTrajectory);

  resetBtn.addEventListener("click", () => {
    document.getElementById("x0").value = "0";
    document.getElementById("y0").value = "0";
    document.getElementById("angle").value = "45";
    document.getElementById("velocity").value = "20";
    document.getElementById("acceleration").value = "9.8";
    resultsDiv.innerHTML = "";
    drawAxes();
  });
});
