import argparse
from pathlib import Path

from PIL import Image


IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.webp'}


def is_image(path: Path) -> bool:
  return path.suffix.lower() in IMAGE_EXTS


def list_images(folder: Path) -> list[Path]:
  return [
    p for p in folder.iterdir()
    if p.is_file() and is_image(p) and not p.name.lower().startswith('thum')
  ]


def pick_source(files: list[Path], mode: str) -> Path | None:
  if not files:
    return None
  if mode == 'largest':
    return max(files, key=lambda p: p.stat().st_size)
  return files[0]


def make_thumb(src: Path, dst: Path, width: int, quality: int, fmt: str) -> None:
  with Image.open(src) as img:
    img = img.convert('RGBA') if img.mode in ('P', 'LA') else img
    w, h = img.size
    if w <= 0 or h <= 0:
      return
    ratio = width / w
    height = max(1, int(round(h * ratio)))
    resized = img.resize((width, height), Image.LANCZOS)

    dst.parent.mkdir(parents=True, exist_ok=True)
    fmt = fmt.lower()
    if fmt == 'jpg' or fmt == 'jpeg':
      if resized.mode in ('RGBA', 'LA'):
        bg = Image.new('RGB', resized.size, (255, 255, 255))
        bg.paste(resized, mask=resized.split()[-1])
        resized = bg
      resized.save(dst, format='JPEG', quality=quality, optimize=True, progressive=True)
    elif fmt == 'webp':
      resized.save(dst, format='WEBP', quality=quality, method=6)
    else:
      resized.save(dst, format='PNG', optimize=True)


def build_target(folder: Path, name: str, fmt: str) -> Path:
  base = name
  if not base.lower().endswith(f'.{fmt}'):
    base = f'{base}.{fmt}'
  return folder / base


def process_folder(folder: Path, width: int, quality: int, name: str, fmt: str,
                   overwrite: bool, pick: str) -> bool:
  files = list_images(folder)
  src = pick_source(files, pick)
  if not src:
    return False
  dst = build_target(folder, name, fmt)
  if dst.exists() and not overwrite:
    return False
  make_thumb(src, dst, width, quality, fmt)
  return True


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument('input_dir', help='이미지 폴더 경로 (카테고리 또는 프로젝트 폴더)')
  parser.add_argument('--width', type=int, default=700, help='썸네일 가로 px')
  parser.add_argument('--quality', type=int, default=88, help='JPEG/WEBP 품질')
  parser.add_argument('--name', default='thums', help='썸네일 파일명(확장자 제외)')
  parser.add_argument('--format', default='webp', choices=['webp', 'jpg', 'png'], help='출력 포맷')
  parser.add_argument('--overwrite', action='store_true', help='기존 썸네일 덮어쓰기')
  parser.add_argument('--recursive', action='store_true', help='하위 폴더 전부 처리')
  parser.add_argument('--pick', default='first', choices=['first', 'largest'], help='썸네일 원본 선택')
  args = parser.parse_args()

  root = Path(args.input_dir).resolve()
  if not root.exists():
    raise SystemExit(f'Not found: {root}')

  targets = []
  if args.recursive:
    for path in root.rglob('*'):
      if path.is_dir():
        targets.append(path)
  else:
    targets = [root]

  changed = 0
  for folder in targets:
    if process_folder(folder, args.width, args.quality, args.name, args.format,
                      args.overwrite, args.pick):
      changed += 1

  print(f'Updated thumbnails: {changed}')


if __name__ == '__main__':
  main()
