package com.google.codeu.servlets;

import java.io.IOException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.codeu.data.Datastore;
import com.google.codeu.data.User;
import org.jsoup.Jsoup;
import org.jsoup.safety.Whitelist;

/**
 * Handles fetching and saving user data.
 */
// When user requests the /about URL, AboutMeServlet class is executed.
@WebServlet("/about")
public class AboutMeServlet extends HttpServlet {

    private Datastore datastore;

    @Override
    public void init() {
        datastore = new Datastore();
    }

    /**
     * Responds with the "about me" section for a particular user.
     */
    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("text/html");

        String user = request.getParameter("user");

        if (user == null || user.equals("")) {
            // Request is invalid, return empty response
            return;
        }

        User userData = datastore.getUser(user);

        if (userData == null || userData.getAboutMe() == null) {
            // User doesn't exist or doesn't have any about me data
            return;
        }

        // Display the user's About Me on the page at http://localhost:8080/about?user=<user>
        response.getOutputStream().println(userData.getAboutMe());
    }

    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        UserService userService = UserServiceFactory.getUserService();
        if (!userService.isUserLoggedIn()) {
            response.sendRedirect("/index.html");
            return;
        }

        String userEmail = userService.getCurrentUser().getEmail();
        // Strip out any potentially dangerous user input, such as HTML code
        String aboutMe = Jsoup.clean(request.getParameter("about-me"), Whitelist.none());

        User user = new User(userEmail, aboutMe);
        datastore.storeUser(user);

        response.sendRedirect("/user-page.html?user=" + userEmail);
    }
}