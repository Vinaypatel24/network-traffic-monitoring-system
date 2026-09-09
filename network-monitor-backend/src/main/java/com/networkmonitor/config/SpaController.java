package com.networkmonitor.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller to forward Single Page Application (SPA) browser routes to index.html
 * so that React Router can handle client-side page rendering without 404 errors.
 */
@Controller
public class SpaController {

    @RequestMapping(value = {
        "/",
        "/login",
        "/register",
        "/dashboard",
        "/packets",
        "/alerts",
        "/blacklist",
        "/settings",
        "/rules"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
