# AlignedReading
Developed from [MultiLitReading](https://github.com/s103062310/MultiLitReading)  

## Different Version
Use branches to maintain different customized versions.

### chunqiu (春秋三傳對讀系統)
- `index.html`: 
  - 修改標題與 meta 資料
  - 刪除 menu「載入資料」、「文件對讀設定」、「段落對讀設定」、「標題顯示設定」
- `/js/language/`:
  - 修改中英標題
  - 刪除 menu 文案 (`menuLoad`, `menuMeta`, `menuAlign`, `menuTitle`)
- `js/main.js`: 
  - hard code 春秋三傳的 query 設定
  - 載入春秋版說明 (`explain_chunqiu.html`)
- `js/ui-aside.js`: 刪除「文本管理」的垃圾桶圖示 (刪除 corpus 的功能)

### four-gospels (四福音對讀系統)
- `index.html`: 
  - 修改標題與 meta 資料
  - 刪除「使用說明」modal
  - 刪除 navbar「我的資料庫」
  - 修改 navbar「回首頁」，新增 id，移除 onclick
  - 新增 navbar「DocuSky logo」，點擊去 DocuSky 首頁
  - 刪除 menu「載入資料」、「文件對讀設定」、「段落對讀設定」、「標題顯示設定」
- `/js/language/`:
  - 修改中英標題
  - 刪除 navbar 文案 (`navDashboard`)，最後一個 DocuSky logo 不用處理
  - 刪除 menu 文案 (`menuLoad`, `menuMeta`, `menuAlign`, `menuTitle`)
  - 刪除「使用說明」modal 文案 (`readmeTitle`)
- `js/main.js`: 
  - 新增 UI.addCorpus() 功能: 以中文版進站預設四個中文 corpus 開啟四個英文 corpus關閉，反之亦然
  - hard code 四福音的 query 設定
  - 刪除「使用說明」 html 的讀取
  - 新增 navbar「回首頁」click function: 去相應語言的系統首頁
  - 新增 navbar「使用說明」click function: 去相應語言的使用說明 pdf 檔
- `js/ui-aside.js`: 刪除「文本管理」的垃圾桶圖示 (刪除 corpus 的功能)
- `js/ui-main.js`: 在 corpus name 的地方加上 corpus 客製圖案
- `css/colors.css`: 調整成客製主題的色票
- `css/body.css`:
  - 修改 body 底色 (auto -> black)
  - 修改 navbar DocuSky logo
  - 修改 navbar tooltip 文字顏色 (white -> black)
  - 修改 語言選擇 hover 顏色 (gray-dark -> gray)
  - 新增 class `btn-dark` 樣式
- `css/main.css`:
  - 調整 `corpus-name`，需多加入一個 40x40 的圖
  - 修改目錄 hover 底色 (blue-lighter -> blue-light)
  - 修改 corpus 欄底色 (white -> blue-darker)
  - 修改 title block hover 底色 (blue-darker -> gray-light)
- `assets/`:
  - 四個 corpus 的 icon
  - 客製網頁縮圖
  - 中英文版使用說明檔

## Change Log

### v3.4
> 2024.04.14
- add url parameter 'target' to access personal db on auto loading
- url parameter 'corpus' accepts no input: load all corpus in db
- add api requester parameter for statistics

### v3.3
> 2024.02.24
- add english version
- add `chunqiu` and `four-gospels` branches
- update explain modal content
- change relative link to absolute link
- change metadata block ui
- refactor some html and css coding
- adjust and extract tool theme colors
- fix title tooltip display
- fix title display error in search mode
- fix broken ui when change screen size and term tag display

### v3.2
> 2024.01.15
- add title display setting
- add url parameter for auto loading
- not login ui for public database list
- fix error caused by same corpus name
- fix english word break
- update change log

### v3.1
> 2021.05.19
- fix bugs
- update new links 

### v3.0
> 2021.01.27
- new implementation of docuxml align tool