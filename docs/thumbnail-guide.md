# 썸네일 생성 가이드 (로컬 전용)

## 준비
```powershell
pip install pillow
```

## 가장 쉬운 사용 (전체 자동)
```powershell
# 전체 gallery 폴더 하위 프로젝트에서 썸네일 자동 생성
python scripts\make_thumbs.py "gallery" --recursive --format webp --width 700 --quality 88 --overwrite
```

## 가장 쉬운 사용 (버튼 클릭)
1. 로컬 서버 실행: `scripts/start_server.ps1` 실행
2. `http://localhost:5173/admin.html` 접속
3. `썸네일 생성` 버튼 클릭

## 카테고리만 처리
```powershell
python scripts\make_thumbs.py "gallery\개인작" --recursive --format webp --width 700 --quality 88 --overwrite
```

## 폴더 1개만 처리
```powershell
python scripts\make_thumbs.py "gallery\홈페이지\1" --format webp --width 700 --quality 88 --overwrite
```

## 옵션 설명
- `--recursive` : 하위 폴더까지 전부 처리
- `--format` : 출력 포맷 (`webp`, `jpg`, `png`)
- `--width` : 썸네일 가로 크기(px)
- `--quality` : JPEG/WEBP 품질 (기본 88)
- `--name` : 썸네일 파일명(확장자 제외, 기본 `thums`)
- `--overwrite` : 이미 있으면 덮어쓰기
- `--pick` : 썸네일 원본 선택 (`first`, `largest`)

## 기본 규칙
- 폴더 안에서 `thum*` 파일은 원본 목록에서 제외
- 기본은 첫 번째 이미지로 썸네일 생성
- `--pick largest`로 가장 큰 파일을 기준으로 생성 가능

## 예시
```powershell
# png로 만들기
python scripts\make_thumbs.py "gallery\커미션" --recursive --format png --width 800 --overwrite

# 가장 큰 이미지를 기준으로 썸네일 만들기
python scripts\make_thumbs.py "gallery\아이콘\1" --format webp --width 700 --quality 90 --pick largest --overwrite
```
