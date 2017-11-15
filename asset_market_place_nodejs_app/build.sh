rm -rf ../BUILD

mkdir ../BUILD
mkdir ../BUILD/SOURCES
mkdir ../BUILD/ARTIFACTS

rsync -av --progress . ../BUILD/SOURCES --exclude node_modules

cd ../BUILD/

zip -r ../BUILD/ARTIFACTS/project.zip SOURCES
cp ../manifest.json ../BUILD/ARTIFACTS/

cd ARTIFACTS/
#../../../tibcliSeg app delete AssetMarketPlace

../../../tibcliSeg app push
