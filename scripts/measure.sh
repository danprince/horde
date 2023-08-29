#!/usr/bin/env bash

file=$1
max_size=13312 # (13 * 1024)
size=$(ls -l "$file" | awk '{ print $5 }')
percent=$(echo "$size / $max_size * 100" | bc -l)
printf "%d/%d bytes (%.2f%%)\n" "$size" "$max_size" "$percent"

build_summary() {
  printf "# Build "

  if (( size < max_size )); then
    printf "✅"
  else
    printf "❌"
  fi

  printf "\n\n"

  printf "\`\`\`mermaid\n"
  printf "pie showData\n"
  printf "    \"Used (bytes)\" : %d\n" "$size"
  printf "    \"Free (bytes)\" : %d\n" "$((max_size - size))"
  printf "\`\`\`\n"
}

if [[ -n "$GITHUB_STEP_SUMMARY" ]]; then
  build_summary > "$GITHUB_STEP_SUMMARY"
fi
