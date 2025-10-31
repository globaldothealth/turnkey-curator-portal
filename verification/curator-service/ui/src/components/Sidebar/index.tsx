import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Drawer,
    Fab,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    BrowserUpdated as BrowserUpdatedIcon,
    Link as LinkIcon,
    List as ListIcon,
    People as PeopleIcon,
    Publish as PublishIcon,
    QueryStats as QueryStatsIcon,
} from '@mui/icons-material';

import { Role } from '../../api/models/User';
import { useAppSelector } from '../../hooks/redux';
import { selectDiseaseName } from '../../redux/app/selectors';
import { selectUser } from '../../redux/auth/selectors';
import { useStyles } from './styled';
import { hasAnyRole } from '../util/helperFunctions';

interface SidebarProps {
    drawerOpen: boolean;
}

const Sidebar = ({ drawerOpen }: SidebarProps): JSX.Element => {
    const { classes } = useStyles();
    const location = useLocation();
    const navigate = useNavigate();

    const diseaseName = useAppSelector(selectDiseaseName);
    const [createNewButtonAnchorEl, setCreateNewButtonAnchorEl] =
        useState<Element | null>();
    const [selectedMenuIndex, setSelectedMenuIndex] = React.useState<number>();
    const user = useAppSelector(selectUser);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openCreateNewPopup = (event: any): void => {
        setCreateNewButtonAnchorEl(event.currentTarget);
    };

    const closeCreateNewPopup = (): void => {
        setCreateNewButtonAnchorEl(undefined);
    };

    const handleNewCaseClick = () => {
        closeCreateNewPopup();

        navigate('/cases/new', { state: { lastLocation: location.pathname } });
    };

    const menuList = useMemo(
        () =>
            user
                ? [
                      {
                          text: 'Pivot tables',
                          icon: <QueryStatsIcon />,
                          to: { pathname: '/pivot-tables', search: '' },
                          displayCheck: (): boolean => true,
                      },
                      {
                          text: 'Line list',
                          icon: <ListIcon />,
                          to: { pathname: '/cases', search: '' },
                          displayCheck: (): boolean => true,
                      },
                    {
                        text: 'Data downloads',
                        icon: <BrowserUpdatedIcon />,
                        to: { pathname: '/data-downloads', search: '' },
                        displayCheck: (): boolean => true,
                    },
                      {
                          text: 'Sources',
                          icon: <LinkIcon />,
                          to: '/sources',
                          displayCheck: (): boolean =>
                              hasAnyRole(user, [Role.Curator]),
                      },
                      {
                          text: 'Uploads',
                          icon: <PublishIcon />,
                          to: '/uploads',
                          displayCheck: (): boolean =>
                              hasAnyRole(user, [Role.Curator]),
                      },
                      {
                          text: 'Manage users',
                          icon: <PeopleIcon />,
                          to: '/users',
                          displayCheck: (): boolean =>
                              hasAnyRole(user, [Role.Admin]),
                      },
                  ]
                : [],
        [user],
    );

    useEffect(() => {
        const menuIndex = menuList.findIndex((menuItem) => {
            const pathname =
                typeof menuItem.to === 'string'
                    ? menuItem.to
                    : menuItem.to.pathname;
            return pathname === location.pathname;
        });
        setSelectedMenuIndex(menuIndex);
    }, [location.pathname, menuList]);

    return (
        <Drawer
            className={classes.drawer}
            variant="persistent"
            anchor="left"
            open={drawerOpen}
            data-testid="sidebar"
            classes={{
                paper: classes.drawerPaper,
            }}
        >
            <div className={classes.drawerContents}>
                <Typography className={classes.diseaseTitle}>
                    {diseaseName}
                </Typography>
                <>
                    {hasAnyRole(user, [Role.Curator, Role.JuniorCurator]) && (
                        <Fab
                            variant="extended"
                            data-testid="create-new-button"
                            className={classes.createNewButton}
                            color="secondary"
                            onClick={openCreateNewPopup}
                        >
                            <AddIcon className={classes.createNewIcon} />
                            Create new
                        </Fab>
                    )}
                    <Menu
                        anchorEl={createNewButtonAnchorEl}
                        keepMounted
                        open={Boolean(createNewButtonAnchorEl)}
                        onClose={closeCreateNewPopup}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                    >
                        <MenuItem
                            onClick={handleNewCaseClick}
                            className={classes.link}
                        >
                            New line list case
                        </MenuItem>
                        <Link
                            to="/cases/bulk"
                            onClick={closeCreateNewPopup}
                            className={classes.link}
                        >
                            <MenuItem>New bulk upload</MenuItem>
                        </Link>
                        {hasAnyRole(user, [Role.Curator]) && (
                            <Link
                                to="/sources/automated"
                                onClick={closeCreateNewPopup}
                                className={classes.link}
                            >
                                <MenuItem>New automated source</MenuItem>
                            </Link>
                        )}
                        {hasAnyRole(user, [Role.Curator]) && (
                            <Link
                                to="/sources/backfill"
                                onClick={closeCreateNewPopup}
                                className={classes.link}
                            >
                                <MenuItem>
                                    New automated source backfill
                                </MenuItem>
                            </Link>
                        )}
                    </Menu>
                </>
                <List>
                    {menuList.map(
                        (item, index) =>
                            item.displayCheck() && (
                                <Link key={item.text} to={item.to}>
                                    <ListItem
                                        button
                                        key={item.text}
                                        selected={selectedMenuIndex === index}
                                    >
                                        <ListItemIcon>{item.icon}</ListItemIcon>

                                        <ListItemText primary={item.text} />
                                    </ListItem>
                                </Link>
                            ),
                    )}
                </List>
            </div>
        </Drawer>
    );
};

export default Sidebar;
