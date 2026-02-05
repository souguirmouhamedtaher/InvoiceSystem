# build project files
pnpm run build
# bundle the build
esbuild dist/main.js  --bundle --platform=node  --outdir=final --external:class-transformer --external:@nestjs/websockets/socket-module --external:@nestjs/microservices
# cd to the output folder
cd final/
# create sea config file
echo '{ "main": "main.js", "output": "alemni-prep.blob" }' > sea-config.json
# generate binary blob file
node --experimental-sea-config sea-config.json
# create a copy of node executable
cp $(command -v node) alemni
# inject the blobl into the binary executable
npx postject alemni NODE_SEA_BLOB alemni-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2