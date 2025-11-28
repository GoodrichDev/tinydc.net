FROM busybox:latest

WORKDIR /home/static

# Create a non-root user to own the files and run our server
RUN adduser -D static
USER static

COPY . .

EXPOSE 80

CMD ["busybox", "httpd", "-f", "-v", "-p", "80"]
