let cvReady = false;
let currentStages = [];
let currentImageIndex = 1;
let totalFiles = 0;
let processedFiles = 0;

// Инициализация прогресс-бара
updateProgressBar();

        // Функция для загрузки OpenCV.js
        function loadOpenCV() {
            return new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "https://docs.opencv.org/4.10.0/opencv.js";
                script.async = true;
                script.onload = () => {
                    const checkCV = setInterval(() => {
                        if (typeof cv !== 'undefined' && cv.Mat) {
                            clearInterval(checkCV);
                            logDebug('OpenCV загружен успешно');
                            cvReady = true;
                            resolve();
                        }
                    }, 100);
                };
                script.onerror = () => {
                    logDebug('Ошибка загрузки OpenCV');
                    reject(new Error("Ошибка загрузки OpenCV"));
                };
                document.head.appendChild(script);
            });
        }

        // Данные о боссах
        let bossData = {
            bosses: {},
            metadata: {
                processing_date: "2025-04-20",
                images_processed: 0
            }
        };

        let images = [];

        // Список известных боссов
        const knownBosses = [
            "Андрас", "Базил", "Баллак", "Бальбо", "Брека", "Буря", "Гарет", "Глаки", 
            "Пан Драйд", "Чудовищный Дракон", "Зеркало Забвения", "Кабрио", "Каменук", 
            "Катан", "Королева Муравьев", "Кельсус", "Корун", "Мутант Крума", "Ландор", 
            "Лилия", "Пан Марод", "Матура", "Медуза", "Модеус", "Зараженный Крума", "Безумный Крума", 
            "Муфа", "Наяда", "Нормус", "Олкут", "Орфен", "Рахха", "Репиро", "Сабан", 
            "Сайракс", "Самуэль", "Селу", "Силла", "Талакин", "Талкин", "Танатос", 
            "Тиминиэль", "Тимитрис", "Уканба", "Фаробос", "Фелис", "Феникс", "Фоллинт", 
            "Хафф", "Хисилром", "Чертуба", "Чудовище", "Шарка", "Энкура", "Сусцептор Ядра", "Веритас", "Рамдал"
        ];

        // Функция для добавления отладочной информации
        function logDebug(message) {
            const debugLog = document.getElementById("debugLog");
            debugLog.textContent += message + "\n";
            debugLog.scrollTop = debugLog.scrollHeight;
        }

        // Обновление прогресс-бара
function updateProgressBar() {
    const progress = totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0;
    const progressBarInner = document.getElementById("progressBarInner");
    const progressText = document.getElementById("progressText");
    progressBarInner.style.width = `${progress}%`;
    progressText.textContent = `Обработано: ${processedFiles} из ${totalFiles} (${Math.round(progress)}%)`;
    // Показываем прогресс-бар, если есть файлы
    const progressContainer = document.getElementById("progressContainer");
    progressContainer.style.display = totalFiles > 0 ? "block" : "none";
}

        // Drag-and-drop функционал
        const dropZone = document.getElementById("dropZone");
        const fileInput = document.getElementById("fileInput");

        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.classList.add("dragover");
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("dragover");
        });

        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.classList.remove("dragover");
            handleFiles(e.dataTransfer.files);
        });

        dropZone.addEventListener("click", () => {
            fileInput.click();
        });

        fileInput.addEventListener("change", () => {
            handleFiles(fileInput.files);
        });

        // Обработка загруженных файлов
async function handleFiles(files) {
    if (!cvReady) {
        logDebug('OpenCV еще не загружен. Ожидание...');
        try {
            await loadOpenCV();
        } catch (error) {
            logDebug('Ошибка: OpenCV не загружен');
            return;
        }
    }

    totalFiles = files.length;
    processedFiles = 0;
    updateProgressBar(); // Обновляем прогресс-бар сразу

    const imageList = document.getElementById("imageList");
    const emptyImageList = document.getElementById("emptyImageList");
    if (totalFiles > 0) {
        imageList.style.display = "block";
        emptyImageList.style.display = "none";
    }

    for (let file of files) {
        images.push({ file, index: currentImageIndex });
        addImageToList(file, currentImageIndex);
        await processImage(file, currentImageIndex);
        currentImageIndex++;
        processedFiles++;
        updateProgressBar();
    }
    updateProcessedCount();
}

        // Отображение загруженных изображений
        function addImageToList(file, index) {
            const imageList = document.getElementById("imageList");
            const imageItem = document.createElement("div");
            imageItem.classList.add("image-item");
            imageItem.innerHTML = `
                <div class="image-item-info">
                    <div class="image-item-icon">
                        <svg class="icon" viewBox="0 0 24 24" width="18" height="18">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path>
                        </svg>
                    </div>
                    <div class="image-item-name">${file.name}</div>
                </div>
                <button class="btn btn-sm btn-outline" onclick="removeImage(${index})">
                    <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                    </svg>
                </button>
            `;
            imageList.appendChild(imageItem);
        }

        // Удаление изображения
        function removeImage(index) {
            images = images.filter(img => img.index !== index);
            for (let boss in bossData.bosses) {
                if (bossData.bosses[boss].source_image === index) {
                    delete bossData.bosses[boss];
                }
            }
            bossData.metadata.images_processed = images.length;
            updateImageList();
            updateProcessedCount();
            updateDisplay();
        }

        // Обновление списка изображений
        function updateImageList() {
            const imageList = document.getElementById("imageList");
            imageList.innerHTML = "";
            images.forEach(img => addImageToList(img.file, img.index));
        }

        // Обновление счетчика обработанных файлов
        function updateProcessedCount() {
            bossData.metadata.images_processed = images.length;
        }

        // Детекция таблицы с помощью OpenCV.js
        function detectTableRegion(imgElement) {
            if (!cvReady || !cv || !cv.Mat) {
                logDebug("OpenCV не готов для использования.");
                return { cropX: 0, cropY: 0, cropWidth: imgElement.width, cropHeight: imgElement.height };
            }

            let src, dst, contours, hierarchy, kernel;
            try {
                src = cv.imread(imgElement);
                dst = new cv.Mat();
                contours = new cv.MatVector();
                hierarchy = new cv.Mat();

                cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
                cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0);
                cv.Canny(dst, dst, 100, 200);
                kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
                cv.dilate(dst, dst, kernel);
                cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

                let maxArea = 0;
                let maxRect = { x: 0, y: 0, width: imgElement.width, height: imgElement.height };

                for (let i = 0; i < contours.size(); i++) {
                    const contour = contours.get(i);
                    const rect = cv.boundingRect(contour);
                    const area = rect.width * rect.height;
                    const aspectRatio = rect.width / rect.height;

                    if (
                        area > maxArea * 0.3 &&
                        rect.width > imgElement.width * 0.15 &&
                        rect.height > imgElement.height * 0.1 &&
                        aspectRatio > 0.5 && aspectRatio < 3 &&
                        rect.width > 50
                    ) {
                        maxArea = area;
                        maxRect = rect;
                    }
                }

                logDebug(`OpenCV: Найдена таблица с координатами: x=${maxRect.x}, y=${maxRect.y}, width=${maxRect.width}, height=${maxRect.height}`);

                return {
                    cropX: maxRect.x,
                    cropY: maxRect.y,
                    cropWidth: maxRect.width,
                    cropHeight: maxRect.height
                };
            } catch (error) {
                logDebug(`Ошибка в detectTableRegion: ${error.message}`);
                return { cropX: 0, cropY: 0, cropWidth: imgElement.width, cropHeight: imgElement.height };
            } finally {
                if (src) src.delete();
                if (dst) dst.delete();
                if (contours) contours.delete();
                if (hierarchy) hierarchy.delete();
                if (kernel) kernel.delete();
            }
        }

        // Предобработка изображения для Tesseract
        function preprocessImageForTesseract(imgElement) {
            if (!cvReady || !cv || !cv.Mat) {
                logDebug("OpenCV не готов для использования.");
                return imgElement;
            }

            let src, dst;
            try {
                src = cv.imread(imgElement);
                dst = new cv.Mat();

                cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
                cv.bitwise_not(dst, dst);
                cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 7, 3);

                const processedCanvas = document.createElement("canvas");
                processedCanvas.width = imgElement.width;
                processedCanvas.height = imgElement.height;
                cv.imshow(processedCanvas, dst);

                return processedCanvas;
            } catch (error) {
                logDebug(`Ошибка в preprocessImageForTesseract: ${error.message}`);
                return imgElement;
            } finally {
                if (src) src.delete();
                if (dst) dst.delete();
            }
        }

        // Детекция текстовой области с помощью Tesseract.js
async function detectTextRegions(imgElement) {
    const processedCanvas = preprocessImageForTesseract(imgElement);

    const { data } = await Tesseract.recognize(processedCanvas, 'rus', {
        logger: (m) => logDebug(`Прогресс Tesseract (детекция текста): ${m.status} (${m.progress * 100}%)`),
        oem: 3,
        psm: 4
    });

    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    const bossPattern = new RegExp(knownBosses.join('|'), 'i');
    const timePattern = /\d{1,2}:\d{1,2}/;
    const datePattern = /\d{2}\.\d{2}\.\d{4}/;

    data.words.forEach(word => {
        const text = word.text.trim();
        if (bossPattern.test(text) || timePattern.test(text) || datePattern.test(text)) {
            const { x0, y0, x1, y1 } = word.bbox;
            minX = Math.min(minX, x0);
            minY = Math.min(minY, y0); // Уменьшаем minY, чтобы захватить верхние строки
            maxX = Math.max(maxX, x1);
            maxY = Math.max(maxY, y1);
        }
    });

    if (minX === Infinity) {
        logDebug("Не удалось найти текст для обрезки. Используется вся область.");
        return { cropX: 0, cropY: 0, cropWidth: imgElement.width, cropHeight: imgElement.height };
    }

    const padding = 30;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding); // Увеличиваем область вверх
    maxX = Math.min(imgElement.width, maxX + padding);
    maxY = Math.min(imgElement.height, maxY + padding);

    logDebug(`Tesseract: Найдена текстовая область: x=${minX}, y=${minY}, width=${maxX - minX}, height=${maxY - minY}`);

    return {
        cropX: minX,
        cropY: minY,
        cropWidth: maxX - minX,
        cropHeight: maxY - minY
    };
}

        // Интеллектуальная обрезка (комбинация OpenCV и Tesseract)
        async function intelligentCrop(imgElement) {
            const tableRegion = detectTableRegion(imgElement);

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = tableRegion.cropWidth;
            tempCanvas.height = tableRegion.cropHeight;
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.drawImage(imgElement, tableRegion.cropX, tableRegion.cropY, tableRegion.cropWidth, tableRegion.cropHeight, 0, 0, tableRegion.cropWidth, tableRegion.cropHeight);

            const textRegion = await detectTextRegions(tempCanvas);

            let finalCrop = {
                cropX: tableRegion.cropX + textRegion.cropX,
                cropY: tableRegion.cropY + textRegion.cropY,
                cropWidth: textRegion.cropWidth,
                cropHeight: textRegion.cropHeight
            };

            const minWidth = imgElement.width * 0.2;
            const minHeight = imgElement.height * 0.2;
            if (finalCrop.cropWidth < minWidth || finalCrop.cropHeight < minHeight) {
                logDebug("Область обрезки слишком мала. Используется адаптивный запасной вариант.");
                finalCrop = {
                    cropX: Math.floor(imgElement.width * 0.65),
                    cropY: Math.floor(imgElement.height * 0.05),
                    cropWidth: imgElement.width - Math.floor(imgElement.width * 0.65) - 50,
                    cropHeight: imgElement.height - Math.floor(imgElement.height * 0.1)
                };
            }

            return finalCrop;
        }

        // Обработка изображения с визуализацией шагов
        async function processImage(file, index) {
            if (!cvReady) {
                logDebug('OpenCV еще не загружен. Ожидание...');
                try {
                    await loadOpenCV();
                } catch (error) {
                    logDebug('Ошибка: OpenCV не загружен');
                    return;
                }
            }

            try {
                logDebug(`Обработка изображения ${index}: ${file.name}`);
                currentStages = [];

                const imgElement = document.createElement("img");
                imgElement.src = URL.createObjectURL(file);
                await new Promise((resolve) => imgElement.onload = resolve);

                const originalCanvas = document.createElement("canvas");
                originalCanvas.width = imgElement.width;
                originalCanvas.height = imgElement.height;
                const originalCtx = originalCanvas.getContext("2d");
                originalCtx.drawImage(imgElement, 0, 0);
                currentStages.push({ name: "Оригинал", canvas: originalCanvas });

                const { cropX, cropY, cropWidth, cropHeight } = await intelligentCrop(imgElement);
                logDebug(`Интеллектуальная обрезка: cropX=${cropX}, cropY=${cropY}, cropWidth=${cropWidth}, cropHeight=${cropHeight}`);

                const croppedCanvas = document.createElement("canvas");
                croppedCanvas.width = cropWidth;
                croppedCanvas.height = cropHeight;
                const croppedCtx = croppedCanvas.getContext("2d");
                croppedCtx.drawImage(imgElement, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
                croppedCtx.strokeStyle = "red";
                croppedCtx.lineWidth = 2;
                croppedCtx.strokeRect(0, 0, cropWidth, cropHeight);
                currentStages.push({ name: "Обрезка", canvas: croppedCanvas });

                let src, dst, kernel, scaledDst;
                try {
                    src = cv.imread(croppedCanvas);
                    dst = new cv.Mat();

                    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
                    const grayCanvas = document.createElement("canvas");
                    grayCanvas.width = cropWidth;
                    grayCanvas.height = cropHeight;
                    cv.imshow(grayCanvas, dst);
                    currentStages.push({ name: "Градации серого", canvas: grayCanvas });

                    cv.bitwise_not(dst, dst);
                    const invertedCanvas = document.createElement("canvas");
                    invertedCanvas.width = cropWidth;
                    invertedCanvas.height = cropHeight;
                    cv.imshow(invertedCanvas, dst);
                    currentStages.push({ name: "Инверсия", canvas: invertedCanvas });

                    kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
                    cv.morphologyEx(dst, dst, cv.MORPH_OPEN, kernel);
                    const morphedCanvas = document.createElement("canvas");
                    morphedCanvas.width = cropWidth;
                    morphedCanvas.height = cropHeight;
                    cv.imshow(morphedCanvas, dst);
                    currentStages.push({ name: "Морфология", canvas: morphedCanvas });

                    cv.threshold(dst, dst, 150, 255, cv.THRESH_BINARY);
                    const thresholdedCanvas = document.createElement("canvas");
                    thresholdedCanvas.width = cropWidth;
                    thresholdedCanvas.height = cropHeight;
                    cv.imshow(thresholdedCanvas, dst);
                    currentStages.push({ name: "Порог", canvas: thresholdedCanvas });

                    const scaleFactor = 2;
                    scaledDst = new cv.Mat();
                    cv.resize(dst, scaledDst, new cv.Size(cropWidth * scaleFactor, cropHeight * scaleFactor), 0, 0, cv.INTER_LINEAR);
                    const finalCanvas = document.createElement("canvas");
                    finalCanvas.width = cropWidth * scaleFactor;
                    finalCanvas.height = cropHeight * scaleFactor;
                    cv.imshow(finalCanvas, scaledDst);
                    currentStages.push({ name: "Масштабирование", canvas: finalCanvas });

                    updateVisualization();

                    // Обновлённая обработка текста
                    try {
                        const { data: { text } } = await Tesseract.recognize(finalCanvas, 'rus', {
                            logger: (m) => logDebug(`Прогресс Tesseract: ${m.status} (${m.progress * 100}%)`),
                        });
                        logDebug("Распознанный текст:\n" + text);

                        const lines = text.split('\n');
                        let lastValidDate = null;
                        let lastValidTime = null;

                        lines.forEach((line, lineIndex) => {
                            if (!line.trim()) return;

                            logDebug(`Строка ${lineIndex + 1}: ${line}`);

                            // Очистка текста
                            let cleanedLine = line.replace(/[^\p{L}\s()0-9.:%-]+/gu, ' ').trim();
                            cleanedLine = cleanedLine.replace(/\s+/g, ' ').trim();
                            cleanedLine = cleanedLine.replace(/^(Состав\s*#\d+\s*)/i, '').trim();
                            cleanedLine = cleanedLine.replace(/^(Зов\s*)/i, '').trim();

                            if (!cleanedLine) {
                                logDebug(`Пропущена строка ${lineIndex + 1}: пустая после очистки`);
                                return;
                            }

                            // Проверка на дату и время
                            const dateMatch = cleanedLine.match(/\d{2}\.\d{2}\.\d{4}/);
                            const timeMatch = cleanedLine.match(/\d{1,2}:\d{1,2}(?:-\d{1,2}:\d{1,2}\s*\(\d+%\))?/);
                            let bossMatch = cleanedLine.match(new RegExp(`(${knownBosses.join('|')})`, 'i'));

                            if (dateMatch) {
                                const [day, month, year] = dateMatch[0].split('.');
                                lastValidDate = `${year}-${month}-${day}`;
                                logDebug(`Обнаружена дата: ${lastValidDate}`);
                            }
                            if (timeMatch) {
                                let time = timeMatch[0].replace(/[^0-9:]/g, '');
                                const [hours, minutes] = time.split(':');
                                if (hours && minutes && parseInt(hours) <= 23 && parseInt(minutes) <= 59) {
                                    time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                                    lastValidTime = time;
                                    logDebug(`Обнаружено время: ${lastValidTime}`);
                                }
                            }

                            if (bossMatch) {
                                let bossName = bossMatch[1].trim();
                                if (bossName.toLowerCase().includes("распределение") ||
                                    bossName.toLowerCase().includes("обитель клана") ||
                                    bossName.toLowerCase().includes("запасы клана") ||
                                    bossName.toLowerCase().includes("управление") ||
                                    bossName.toLowerCase().includes("бонусы клана") ||
                                    bossName.toLowerCase().includes("история") ||
                                    bossName.toLowerCase().includes("состав")) {
                                    logDebug(`Пропущена строка ${lineIndex + 1}: не является боссом (${bossName})`);
                                    return;
                                }

                                let matchedBoss = bossName;
                                for (const knownBoss of knownBosses) {
                                    const bossNameLower = bossName.toLowerCase();
                                    const knownBossLower = knownBoss.toLowerCase().replace("нада", "наяда");
                                    if (bossNameLower.includes(knownBossLower) || knownBossLower.includes(bossNameLower)) {
                                        matchedBoss = knownBoss;
                                        break;
                                    }
                                }

                                if (!matchedBoss) {
                                    logDebug(`Пропущена строка ${lineIndex + 1}: неизвестный босс (${bossName})`);
                                    return;
                                }

                                // Используем последнюю валидную дату и время, если они есть
                                let date = lastValidDate || "2025-04-22"; // Установим текущую дату по умолчанию
                                let time = lastValidTime || cleanedLine.match(/\d{1,2}:\d{1,2}/)?.[0]?.replace(/[^0-9:]/g, '') || "00:00";
                                if (time) {
                                    const [hours, minutes] = time.split(':');
                                    time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                                }
                                const fullTime = `${date} ${time}`;

                                logDebug(`Распознано: Босс: "${matchedBoss}", Дата: "${date}", Время: "${time}"`);
                                addBossData(matchedBoss, time, fullTime, index);
                            } else {
                                logDebug(`Строка ${lineIndex + 1} не содержит известного босса`);
                            }
                        });

                        updateDisplay();
                    } catch (error) {
                        logDebug(`Ошибка при распознавании текста: ${error.message}`);
                        throw error;
                    }
                } finally {
                    if (src) src.delete();
                    if (dst) dst.delete();
                    if (kernel) kernel.delete();
                    if (scaledDst) scaledDst.delete();
                }
            } catch (error) {
                logDebug(`Ошибка при обработке изображения: ${error.message}`);
            }
        }

        // Обновление визуализации
        function updateVisualization() {
            const stageCanvas = document.getElementById("stageCanvas");
            const stageButtons = document.getElementById("stageButtons");
            stageButtons.innerHTML = "";

            if (currentStages.length === 0) {
                stageCanvas.width = 100;
                stageCanvas.height = 100;
                const ctx = stageCanvas.getContext("2d");
                ctx.fillStyle = "#333";
                ctx.fillRect(0, 0, 100, 100);
                ctx.fillStyle = "#fff";
                ctx.font = "16px Arial";
                ctx.fillText("Нет данных", 10, 50);
                return;
            }

            const firstStage = currentStages[0];
            stageCanvas.width = firstStage.canvas.width;
            stageCanvas.height = firstStage.canvas.height;
            const ctx = stageCanvas.getContext("2d");
            ctx.drawImage(firstStage.canvas, 0, 0);

            currentStages.forEach((stage, index) => {
                const button = document.createElement("button");
                button.className = "stage-button" + (index === 0 ? " active" : "");
                button.textContent = stage.name;
                button.onclick = () => {
                    document.querySelectorAll(".stage-button").forEach(btn => btn.classList.remove("active"));
                    button.classList.add("active");
                    stageCanvas.width = stage.canvas.width;
                    stageCanvas.height = stage.canvas.height;
                    const ctx = stageCanvas.getContext("2d");
                    ctx.drawImage(stage.canvas, 0, 0);
                };
                stageButtons.appendChild(button);
            });
        }

        // Добавление данных о боссе
        function addBossData(name, time, full_time, source_image) {
            if (bossData.bosses[name]) {
                const existingFullTime = new Date(bossData.bosses[name].full_time);
                const newFullTime = new Date(full_time);
                if (newFullTime > existingFullTime) {
                    bossData.bosses[name] = { time, full_time, source_image };
                }
            } else {
                bossData.bosses[name] = { time, full_time, source_image };
            }
        }

        // Обновление отображения результатов
        let showFullDate = false; // Состояние отображения полной даты
        function updateDisplay() {
            const emptyResults = document.getElementById("emptyResults");
            const resultsContent = document.getElementById("resultsContent");
            const bossList = document.getElementById("bossList");
            
            // Очищаем список боссов
            bossList.innerHTML = "";
            
            const bossEntries = Object.entries(bossData.bosses);
            
            if (bossEntries.length === 0) {
                emptyResults.style.display = "flex";
                resultsContent.style.display = "none";
                return;
            }
            
            emptyResults.style.display = "none";
            resultsContent.style.display = "block";
            
            // Сортируем боссов по времени
            bossEntries.sort((a, b) => a[1].order - b[1].order);
            
            // Добавляем боссов в список
            bossEntries.forEach(([bossName, data]) => {
                const bossItem = document.createElement("div");
                bossItem.classList.add("boss-item");
                
                const shortName = {
                    "Андрас": "Андрас",
                    "Базил": "Базил",
                    "Баллак": "Баллак",
                    "Бальбо": "Бальбо",
                    "Брека": "Брека",
                    "Буря": "Буря",
                    "Гарет": "Гарет",
                    "Глаки": "Глаки",
                    "Пан Драйд": "Драйд",
                    "Чудовищный Дракон": "Дракон",
                    "Зеркало Забвения": "Зеркало",
                    "Кабрио": "Кабрио",
                    "Каменук": "Каменук",
                    "Катан": "Катан",
                    "Королева Муравьев": "Квина",
                    "Кельсус": "Кельсус",
                    "Корун": "Корун",
                    "Мутант Крума": "Мутант",
                    "Безумный Крума": "Мутант",
                    "Ландор": "Ландор",
                    "Лилия": "Лилия",
                    "Пан Марод": "Марод",
                    "Матура": "Матура",
                    "Медуза": "Медуза",
                    "Модеус": "Модеус",
                    "Зараженный Крума": "Крума",
                    "Муфа": "Муфа",
                    "Наяда": "Наяда",
                    "Нормус": "Нормус",
                    "Олкут": "Олкут",
                    "Орфен": "Орфен",
                    "Рахха": "Рахха",
                    "Репиро": "Репиро",
                    "Сабан": "Сабан",
                    "Сайракс": "Сайракс",
                    "Самуэль": "Самуэль",
                    "Селу": "Селу",
                    "Силла": "Силла",
                    "Талакин": "Талакин",
                    "Талкин": "Талкин",
                    "Танатос": "Танатос",
                    "Тиминиэль": "Тиминиэль",
                    "Тимитрис": "Тимитрис",
                    "Уканба": "Уканба",
                    "Фаробос": "Фаробос",
                    "Фелис": "Фелис",
                    "Феникс": "Феникс",
                    "Фоллинт": "Фоллинт",
                    "Хафф": "Хафф",
                    "Хисилром": "Хисилром",
                    "Чертуба": "Чертуба",
                    "Чудовище": "Чудовище",
                    "Шарка": "Шарка",
                    "Энкура": "Энкура",
                    "Сусцептор Ядра": "Ядро"
                }[bossName] || bossName;
                const timeDisplay = showFullDate ? data.full_time : data.time;
                
                bossItem.innerHTML = `
                    <span class="boss-name">${shortName}</span>
                    <span class="boss-time">${timeDisplay}</span>
                `;
                
                bossList.appendChild(bossItem);
            });
        }

        // Функция для копирования результатов в буфер обмена
        function copyResults() {
            const bossEntries = Object.entries(bossData.bosses);
            
            if (bossEntries.length === 0) {
                alert("Нет данных для копирования!");
                return;
            }
            
            // Сортируем боссов по времени
            bossEntries.sort((a, b) => a[1].order - b[1].order);
            
            // Формируем текст для копирования
    const resultText = bossEntries.map(([bossName, data], index) => {
        const shortName = {
                    "Андрас": "Андрас",
                    "Базил": "Базил",
                    "Баллак": "Баллак",
                    "Бальбо": "Бальбо",
                    "Брека": "Брека",
                    "Буря": "Буря",
                    "Гарет": "Гарет",
                    "Глаки": "Глаки",
                    "Пан Драйд": "Драйд",
                    "Чудовищный Дракон": "Дракон",
                    "Зеркало Забвения": "Зеркало",
                    "Кабрио": "Кабрио",
                    "Каменук": "Каменук",
                    "Катан": "Катан",
                    "Королева Муравьев": "Квина",
                    "Кельсус": "Кельсус",
                    "Корун": "Корун",
                    "Мутант Крума": "Мутант",
                    "Безумный Крума": "Мутант",
                    "Ландор": "Ландор",
                    "Лилия": "Лилия",
                    "Пан Марод": "Марод",
                    "Матура": "Матура",
                    "Медуза": "Медуза",
                    "Модеус": "Модеус",
                    "Зараженный Крума": "Крума",
                    "Муфа": "Муфа",
                    "Наяда": "Наяда",
                    "Нормус": "Нормус",
                    "Олкут": "Олкут",
                    "Орфен": "Орфен",
                    "Рахха": "Рахха",
                    "Репиро": "Репиро",
                    "Сабан": "Сабан",
                    "Сайракс": "Сайракс",
                    "Самуэль": "Самуэль",
                    "Селу": "Селу",
                    "Силла": "Силла",
                    "Талакин": "Талакин",
                    "Талкин": "Талкин",
                    "Танатос": "Танатос",
                    "Тиминиэль": "Тиминиэль",
                    "Тимитрис": "Тимитрис",
                    "Уканба": "Уканба",
                    "Фаробос": "Фаробос",
                    "Фелис": "Фелис",
                    "Феникс": "Феникс",
                    "Фоллинт": "Фоллинт",
                    "Хафф": "Хафф",
                    "Хисилром": "Хисилром",
                    "Чертуба": "Чертуба",
                    "Чудовище": "Чудовище",
                    "Шарка": "Шарка",
                    "Энкура": "Энкура",
                    "Сусцептор Ядра": "Ядро"
        }[bossName] || bossName;
        const timeDisplay = showFullDate ? data.full_time : data.time;
        
        // Добавляем "+" только перед именем первого босса в списке для копирования
        const displayName = index === 0 ? `+${shortName}` : shortName;
        
        return `${displayName} ${timeDisplay}`;
    }).join(", ");
    
    navigator.clipboard.writeText(resultText).then(() => {
        logDebug("Результаты скопированы в буфер обмена");
        alert("Результаты скопированы!");
    }).catch(err => {
        logDebug(`Ошибка копирования: ${err}`);
        alert("Ошибка при копировании.");
    });
}

        // Функция для переключения отображения полной даты
        function toggleFullDate() {
            showFullDate = !showFullDate;
            updateDisplay();
            logDebug(`Отображение полной даты: ${showFullDate}`);
        }

        // Экспорт в CSV
        function exportToCSV() {
            let csv = "Босс,Время,Полная дата,Источник\n";
            for (let boss in bossData.bosses) {
                const data = bossData.bosses[boss];
                csv += `${boss},${data.time},${data.full_time},${data.source_image}\n`;
            }

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "boss_data.csv";
            link.click();
        }

        // Инициализация аккордеона
        document.addEventListener("DOMContentLoaded", function() {
            const accordions = document.querySelectorAll('.accordion');
            accordions.forEach(accordion => {
                accordion.addEventListener('click', function() {
                    this.classList.toggle('active');
                    const panel = this.nextElementSibling;
                    if (panel.style.maxHeight) {
                        panel.style.maxHeight = null;
                    } else {
                        panel.style.maxHeight = panel.scrollHeight + "px";
                    }
                });
            });
        });
