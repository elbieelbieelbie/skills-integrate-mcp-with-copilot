# Mergington High School Activities API

A simple FastAPI application for viewing and managing extracurricular activities at Mergington High School.

## Features

- View all available extracurricular activities
- Teachers can sign up and unregister students after logging in
- Students and other visitors can view activities and registered participants without logging in

## Getting Started

1. From the repository root, install the dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Configure the teacher credentials in the environment. Both values are required; activity changes stay disabled if either is missing:

   ```
   export TEACHER_USERNAME='teacher'
   export TEACHER_PASSWORD='replace-with-a-strong-password'
   ```

   Use your deployment's secret manager for real credentials. Do not commit credentials to source control.

3. From the `src` directory, start the application:

   ```
   cd src
   uvicorn app:app --reload
   ```

4. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc
   - Activities website: http://localhost:8000/

The website keeps teacher credentials in memory only for the current page session. For any non-local deployment, serve the site and API over HTTPS; HTTP Basic credentials are not encrypted in transit.

## API Endpoints

| Method | Endpoint                                                          | Description                                                                  |
| ------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Publicly list activities and their participants                              |
| GET    | `/auth/teacher`                                                   | Verify teacher credentials using HTTP Basic authentication                  |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Teacher-only: sign up a student                                              |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Teacher-only: unregister a student                                        |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

Activity data is stored in memory, so it resets when the server restarts. Teacher credentials are provided through environment variables and are never stored in the application files.
