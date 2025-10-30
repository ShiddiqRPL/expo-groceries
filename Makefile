IMAGE_NAME=expo-minimal
SERVICE=expo


.PHONY:
	build up shell create-app start clean volumes


build:
	docker-compose build --no-cache


up:
	docker-compose up -d


shell:
	docker exec -it expo-groceries-expo-1 bash


create-app:
	docker-compose run --rm $(SERVICE) npx create-expo-app my-app --template blank


start:
	docker-compose run --rm --service-ports $(SERVICE) bash -lc "cd my-app && expo start --tunnel"


clean:
	docker volume rm $$(docker volume ls -q | grep expo_) || true


volumes:
	docker volume ls | grep expo_ || true

permission-local:
	sudo chown -R $(shell whoami):$(shell whoami) .

permission-root:
	sudo chown -R root:root .