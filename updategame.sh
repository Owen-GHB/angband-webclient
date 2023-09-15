#!/usr/bin/env bash
cd ~/games/$1/nightly
git pull
if test $1 = 'coffeeband'
then
git reset --hard origin/coffeeband
else
git reset --hard origin/master
fi
if test $1 = 'angband-master' || test $1 = 'composband' || test $1 = 'frogcomposband' || test $1 = 'angband' || test $1 = 'coffeeband' || test $1 = 'firstageangband' || test $1 = 'faangband'|| test $1 = 'narsil'
then
printf "Rebuild makefiles? (use for version changes or build configuration changes) [y/n]"
read -n 1 ans
if test $ans = 'y'
then
./autogen.sh
./configure --with-no-install --disable-x11
fi
printf "clean object files?"
read -n 1 ans
if test $ans = 'y'
then
make clean
fi
make
elif test $1 = 'silq-dev' || test $1 = 'silq'
then
cd src
printf "clean object files?"
read -n 1 ans
if test $ans = 'y'
then
rm *.o
fi
make -f Makefile.nfe
cd ../
else
printf "Updates for this variant have not been scripted. How did you get here?"
fi

printf "Build complete, proceed to replace executable? [y/n]"
read -n 1 ans
if test $ans = 'y'
then
rm $1
if test $1 = 'angband-master' || test $1 = 'coffeeband'
then
cp src/angband ./$1
fi
if test $1 = 'firstageangband'
then
cp src/faangband ./$1
fi
if test $1 = 'composband' || test $1 = 'frogcomposband' || test $1 = 'angband'|| test $1 = 'faangband' || test $1 = 'narsil'
then
cp src/$1 ./
fi
if test $1 = 'silq-dev' || test $1 = 'silq'
then
cp src/sil ./$1
fi
else
printf "\nExecutable not updated. Lib files replaced."
fi
printf "\nOperation complete. Press any key to continue".
read -n 1
