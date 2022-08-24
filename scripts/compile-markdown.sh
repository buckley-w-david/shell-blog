#!/usr/bin/sh

for file in $(find site -type f -name '*.md'); do
    name=${file#"site/"}
    name=${name#"filesystem/"}
    fname=`basename ${file%.*}`
    title=`python -c "print(' '.join('$fname'.split('-')).title())"`
    pandoc -s -c /blog.css --metadata title="$title" $file -o dist/"${name%.*}".html 
done
