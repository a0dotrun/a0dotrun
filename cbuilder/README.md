### GitHub

```
go run main.go github --app <> --install <> --pem ../../gh-a0dotrun-pk.pem
```

With Output file:

```
go run main.go github --app <> --install <> --pem ../../gh-a0dotrun-pk.pem --o ./token.txt
```

#### Builder

```
go run main.go builder --image image:latest --dir ../../../mcping/ \
    --log http --http-endpoint http://localhost:5000/logs/auth \
    --header Token=TOKEN \
    --header Authorization=BEARER TOKEN
```
