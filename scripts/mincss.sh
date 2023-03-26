#!/usr/bin/env sh

set -e

main() {
    if [ "$CI" ]; then
        echo 'Minifying all CSS'

        [ -d 'content/' ] || return

        find content/ -not -ipath "./node_modules/*" -type f \
            -name "*.css" ! -name "*.min.*" ! -name "vfs_fonts*" \
            -exec uglifycss --output {}.min {} \; \
            -exec rm {} \; \
            -exec mv {}.min {} \;
    else
        echo 'Not in CI mode, skipping CSS minification'
    fi
}

main "$@"
