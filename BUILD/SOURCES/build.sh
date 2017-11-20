
# Delete the BUILD workspace
rm -rf ../BUILD

# Recreate the BUILD workspace
mkdir ../BUILD
# Will contain the source
mkdir ../BUILD/SOURCES
#Will contain the deploy artifacts
mkdir ../BUILD/ARTIFACTS

#Copy the working workspace to SOURCE folder (while exluding the node_modules folder which is not to be deployed, but needed to test locally)
rsync -av --progress . ../BUILD/SOURCES --exclude node_modules

cd ../BUILD/
#Zip the SOURCES folder and put it in ARTIFACT folder
zip -r ../BUILD/ARTIFACTS/project.zip SOURCES
#Copy the manifest to the ARTIFACT folder
cp ../manifest.json ../BUILD/ARTIFACTS/

cd ARTIFACTS/
#We could remove the app first
#../../../tibcliSeg app delete AssetMarketPlace

#Run the tibcli (BECAREFULL, if you use mutliple account , you should use the tibcli downloaded with the account you want to deploy with) 
../../../tibcliSeg app push
