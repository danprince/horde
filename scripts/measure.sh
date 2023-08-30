#!/usr/bin/env bash

file=$1
max_size=13312 # (13 * 1024)
size=$(ls -l "$file" | awk '{ print $5 }')
percent=$(echo "$size / $max_size * 100" | bc -l)
emoji=$( (( size <= max_size )) && echo "✅" || echo "❌")
printf "%s %d/%d bytes (%.2f%%)\n" "$emoji" "$size" "$max_size" "$percent"

if [[ -n "$GITHUB_STEP_SUMMARY" ]]; then
  printf "
\`\`\`mermaid
%%%%{
  init: {
    'theme': 'base',
    'themeVariables': {
      'pie1': '#b12a34',
      'pie2': '#fff',
      'pieOpacity': 1,
      'fontFamily': 'monospace',
      'pieStrokeWidth': '4px',
      'pieSectionTextSize': '40px',
      'pieTitleTextSize': '30px',
      'pieLegendTextSize': '25px'
    }
  }
}%%%%
pie showData
    title Budget (%.2f%%) %s
    \"Used (bytes)\": %d
    \"Free (bytes)\": %d
\`\`\`
" "$percent" "$emoji" "$size" "$((max_size - size))" > "$GITHUB_STEP_SUMMARY"
fi
