# 폰투 (fontu)

상업적 사용 가능한 무료 한글 폰트 큐레이션 사이트.

## 실행

```bash
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000 접속.

## 폰트 추가하기

`fonts.json`에 항목을 추가하면 자동으로 카드가 렌더링됨.

```json
{
  "id": 11,
  "name": "한글 이름",
  "englishName": "English Name",
  "designer": "디자이너/회사",
  "category": "고딕 | 명조 | 손글씨 | 디스플레이",
  "license": "OFL",
  "licenseNote": "상업적 사용 가능",
  "googleFontFamily": "Google Fonts 패밀리명 (없으면 빈 문자열)",
  "weights": [400, 700],
  "downloadUrl": "다운로드 페이지 URL",
  "sourceUrl": "원 출처 URL",
  "tags": ["무료", "상업적사용가능"]
}
```

미리보기는 Google Fonts CDN을 사용하므로, `googleFontFamily`가 비어있으면 시스템 폰트로 표시됨.
