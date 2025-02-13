document.getElementById('fetchImages').addEventListener('click', async () => {
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        let results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractImages
        });

        if (results && results[0].result) {
            displayImages(results[0].result);
        } else {
            console.error("画像が取得できませんでした");
            alert("画像が見つかりませんでした。");
        }
    } catch (error) {

        if (confirm("画像が見つかりませんでした。\nスタンプを選ぶには以下のURLを開きますか？\n\nhttps://store.line.me/home/ja")) {
            window.open("https://store.line.me/home/ja", "_blank");
        }
    }
});

function extractImages() {
    console.log("extractImages 関数が実行されました");

    let imageUrls = new Set();

    let spans = document.querySelectorAll("span.mdCMN09Image, span.FnPreview");
    spans.forEach(span => {
        let style = span.getAttribute("style");
        if (style) {
            let match = style.match(/url\(["']?(.*?)["']?\)/);
            if (match && match[1]) {
                imageUrls.add(match[1]);
            }
        }
    });

    let stickerItems = document.querySelectorAll("li[data-preview]");
    stickerItems.forEach(item => {
        let data = item.getAttribute("data-preview");
        if (data) {
            try {
                let jsonData = JSON.parse(data.replace(/&quot;/g, '"'));
                if (jsonData.staticUrl) imageUrls.add(jsonData.staticUrl);
                if (jsonData.fallbackStaticUrl) imageUrls.add(jsonData.fallbackStaticUrl);
                if (jsonData.animationUrl) imageUrls.add(jsonData.animationUrl);
            } catch (e) {
                console.error("エラー:", e);
            }
        }
    });

    console.log("取得した画像URL:", Array.from(imageUrls));
    return Array.from(imageUrls);
}

function displayImages(imageUrls) {
    console.log("displayImages 関数が実行されました", imageUrls);

    const container = document.getElementById('imageContainer');
    if (!container) return;

    container.innerHTML = '';

    imageUrls.forEach(imgUrl => {
        let div = document.createElement('div');
        div.className = 'image-container';

        let img = document.createElement('img');
        img.src = imgUrl;

        let a = document.createElement('a');
        a.href = imgUrl;
        a.innerText = 'ダウンロード';
        a.style.display = 'block';
        a.style.marginTop = '5px';

        a.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('ダウンロードURL:', imgUrl);
            downloadImage(imgUrl);
        });

        div.appendChild(img);
        div.appendChild(a);
        container.appendChild(div);
    });

    if (imageUrls.length === 0) {
        alert('画像が見つかりませんでした');
    }
}

function downloadImage(url) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const a = document.createElement('a');
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = 'sticker.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => console.error('画像のダウンロードに失敗しました', error));
}
